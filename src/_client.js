import { createClient } from '@urql/svelte';

export default createClient({
  url: 'https://graphql.us.fauna.com/graphql',
  fetchOptions: () => {
    const token = 'fnAEchxjaYAAQdooUe1q-CxPdrts3NT9BotzH15l';
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});