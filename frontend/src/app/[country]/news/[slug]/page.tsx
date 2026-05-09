import { redirect } from 'next/navigation';
import { routeToCountryCode, countryCodeToRoute } from '@/lib/geo';

export default async function CountryArticleRedirectPage({
  params,
}: {
  params: { country: string; slug: string };
}) {
  const { country, slug } = params;
  const normalizedCountry = countryCodeToRoute(routeToCountryCode(country));
  redirect(`/news/${slug}?country=${normalizedCountry}`);
}
