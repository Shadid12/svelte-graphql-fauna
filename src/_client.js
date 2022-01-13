import { createClient } from '@urql/svelte';
import Cookies from 'js-cookie';

const cookies = Cookies.get('MY_SVELTE_APP');
let sessionToken = cookies ? JSON.parse(cookies).secret : null;

console.log('sessionToken', sessionToken);

export default createClient({
  url: 'https://graphql.fauna.com/graphql',
  fetchOptions: () => {
    const token = 'fnAEciO6GpACUQE6F_kD35MK533Sljxqs3ExOLKT';
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});