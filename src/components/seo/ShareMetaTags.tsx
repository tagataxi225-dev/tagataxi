import { Helmet } from 'react-helmet-async';

interface ShareMetaTagsProps {
  title: string;
  description: string;
  image?: string;
  url: string;
}

export const ShareMetaTags: React.FC<ShareMetaTagsProps> = ({ 
  title, 
  description, 
  image = '/app-icon-512.png',
  url 
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    
    {/* Open Graph pour Facebook/WhatsApp */}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={url} />
    <meta property="og:image" content={image} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="TAGA Shop" />
    
    {/* Twitter Card */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
  </Helmet>
);
