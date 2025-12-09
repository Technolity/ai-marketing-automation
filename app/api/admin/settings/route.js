import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Cache for admin settings (15 minute TTL)
const settingsCache = {
  data: null,
  timestamp: 0,
  TTL: 15 * 60 * 1000 // 15 minutes
};

// GET - Retrieve all admin settings
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin access
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_tier')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile || profile.user_tier !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check cache first
    const now = Date.now();
    if (settingsCache.data && (now - settingsCache.timestamp) < settingsCache.TTL) {
      return NextResponse.json({
        settings: settingsCache.data,
        cached: true
      });
    }

    // Fetch all settings from database
    const { data: settingsData, error: settingsError } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value, updated_at')
      .order('setting_key', { ascending: true });

    if (settingsError) {
      throw settingsError;
    }

    // Transform array into object structure
    const settings = {};
    settingsData.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    // Flatten the structure for frontend
    const flatSettings = {
      // General
      siteName: settings.general?.siteName || 'TedOS',
      siteDescription: settings.general?.siteDescription || 'AI Marketing Automation Platform',
      userRegistration: settings.general?.userRegistration ?? true,
      maintenanceMode: settings.general?.maintenanceMode ?? false,

      // User Management
      autoApproveContent: settings.user_management?.autoApproveContent ?? false,
      maxUsersPerTier: settings.user_management?.maxUsersPerTier || {
        basic: 1000,
        premium: 500,
        enterprise: 100
      },

      // Notifications
      emailNotifications: settings.notifications?.emailNotifications ?? true,
      adminEmail: settings.notifications?.adminEmail || 'admin@tedos.com',

      // Security
      require2FA: settings.security?.require2FA ?? false,
      allowAPIAccess: settings.security?.allowAPIAccess ?? true,

      // Advanced
      apiEndpoint: settings.advanced?.apiEndpoint || 'https://api.tedos.com',
      webhookUrl: settings.advanced?.webhookUrl || '',
      customCSS: settings.advanced?.customCSS || ''
    };

    // Update cache
    settingsCache.data = flatSettings;
    settingsCache.timestamp = now;

    return NextResponse.json({
      settings: flatSettings,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update admin settings
export async function PUT(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin access
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_tier')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile || profile.user_tier !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, settings: newSettings } = body;

    if (!category || !newSettings) {
      return NextResponse.json(
        { error: 'Category and settings are required' },
        { status: 400 }
      );
    }

    // Map frontend categories to database keys
    const categoryMap = {
      'general': 'general',
      'users': 'user_management',
      'database': 'database',
      'notifications': 'notifications',
      'security': 'security',
      'advanced': 'advanced'
    };

    const settingKey = categoryMap[category];
    if (!settingKey) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Update or insert setting
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert({
        setting_key: settingKey,
        setting_value: newSettings,
        updated_by: session.user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Clear cache after update
    settingsCache.data = null;
    settingsCache.timestamp = 0;

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data
    });

  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Handle bulk operations (export, delete, clear cache)
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin access
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_tier')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile || profile.user_tier !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear_cache':
        // Clear settings cache
        settingsCache.data = null;
        settingsCache.timestamp = 0;

        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        });

      case 'export_database':
        // Export all key database tables
        const tables = ['user_profiles', 'saved_sessions', 'slide_results', 'admin_settings'];
        const exportData = {};

        for (const table of tables) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1000);

          if (!error) {
            exportData[table] = data;
          }
        }

        return NextResponse.json({
          success: true,
          data: exportData,
          exportedAt: new Date().toISOString(),
          message: 'Database exported successfully'
        });

      case 'delete_test_data':
        // Delete sessions older than 30 days with test data indicators
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { error: deleteError } = await supabase
          .from('saved_sessions')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString())
          .or('business_name.ilike.%test%,business_name.ilike.%demo%');

        if (deleteError) {
          throw deleteError;
        }

        return NextResponse.json({
          success: true,
          message: 'Test data deleted successfully'
        });

      case 'export_users':
        // Export all users data
        const { data: users, error: usersError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersError) {
          throw usersError;
        }

        return NextResponse.json({
          success: true,
          data: users,
          count: users.length,
          exportedAt: new Date().toISOString(),
          message: 'Users exported successfully'
        });

      case 'bulk_delete_inactive':
        // Delete users who haven't logged in for 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { data: inactiveUsers, error: inactiveError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .lt('last_login', ninetyDaysAgo.toISOString())
          .neq('user_tier', 'admin');

        if (inactiveError) {
          throw inactiveError;
        }

        // Note: Actual user deletion should be done carefully with cascade
        return NextResponse.json({
          success: true,
          count: inactiveUsers.length,
          message: `Found ${inactiveUsers.length} inactive users (deletion simulated for safety)`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform operation', details: error.message },
      { status: 500 }
    );
  }
}
