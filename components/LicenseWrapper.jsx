"use client";
import { useAuth } from '@/contexts/AuthContext';
import LicenseAgreementModal from './LicenseAgreementModal';

/**
 * LicenseWrapper
 * 
 * A wrapper component that shows the license agreement modal
 * when a logged-in user hasn't accepted the license yet.
 */
export default function LicenseWrapper({ children }) {
    const { user, loading, licenseAccepted, acceptLicense } = useAuth();

    // Don't show modal while loading or if no user is logged in
    const showModal = !loading && user && !licenseAccepted;

    const handleAccept = () => {
        acceptLicense();
    };

    return (
        <>
            {children}
            <LicenseAgreementModal
                isOpen={showModal}
                onAccept={handleAccept}
            />
        </>
    );
}
