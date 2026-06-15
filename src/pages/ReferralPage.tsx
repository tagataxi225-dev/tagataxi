/**
 * 🎁 Page de parrainage client
 */

import { ClientReferralDashboard } from '@/components/referral/ClientReferralDashboard';
import { Helmet } from 'react-helmet-async';

const ReferralPage = () => {
  return (
    <>
      <Helmet>
        <title>Parrainage | Tembea</title>
        <meta name="description" content="Invitez vos amis sur Tembea et gagnez des récompenses" />
      </Helmet>
      <ClientReferralDashboard />
    </>
  );
};

export default ReferralPage;
