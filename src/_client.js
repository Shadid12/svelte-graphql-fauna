import { createClient } from '@urql/svelte';

export default createClient({
  url: 'https://graphql.fauna.com/graphql',
  fetchOptions: () => {
    const token = 'fnAEciO6GpACUQE6F_kD35MK533Sljxqs3ExOLKT';
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});
