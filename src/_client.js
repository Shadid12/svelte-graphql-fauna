import { createClient } from '@urql/svelte';

export default createClient({
  url: 'http://localhost:3000/graphql',
});