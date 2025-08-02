import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
    const response = await fetch('/markdown/privacy.md');
  const content = await response.text();

  return {
    content
  };
};
