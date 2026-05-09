import HomePage from '@/app/page';

export default async function CountryNewsPage({
  params,
  searchParams,
}: {
  params: { country: string };
  searchParams?: { lang?: string };
}) {
  const routeParams = params;
  const query = searchParams || {};

  return HomePage({
    searchParams: {
      country: routeParams.country,
      lang: query.lang,
    },
  });
}
