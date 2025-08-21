import { useParams, Navigate } from 'react-router-dom';

export default function LegacyResultRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/results/${slug}` : '/results'} replace />;
}
