import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePreferencesForm from './Partials/UpdatePreferencesForm';
import UpdateSecurePasswordForm from './Partials/UpdateSecurePasswordForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-text">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-6 space-y-[6px]">
                <div className="mx-auto max-w-7xl space-y-[6px] sm:px-6 lg:px-8">
                    <div className="bg-surface p-4 border border-border sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-surface p-4 border border-border sm:rounded-lg sm:p-8">
                        <UpdatePreferencesForm className="max-w-xl" />
                    </div>

                    <div className="bg-surface p-4 border border-border sm:rounded-lg sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-surface p-4 border border-border sm:rounded-lg sm:p-8">
                        <UpdateSecurePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-surface p-4 border border-border sm:rounded-lg sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
