import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch('/static/markdown/terms.md');
  const content = await response.text();

  return {
    content
  };
};
