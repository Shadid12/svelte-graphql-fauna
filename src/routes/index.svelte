<script context="module" lang="ts">
	export const prerender = true;
</script>


<script lang="ts">
  import { goto } from '$app/navigation';
	import { setClient } from '@urql/svelte';
	import { operationStore, query } from '@urql/svelte';
	import client from '../_client'
	setClient(client);
  const speakers = operationStore(`
    query {
      speakers {
        data {
          _id
          firstname
          lastname
          bio
          picture
        }
      }
    }
  `)
	query(speakers);

  const navigateToProfile = (id) => {
    goto(`/speakers/${id}`);
  }
</script>

<h1>All Speakers</h1>

{#if $speakers.fetching}
<p>Loading...</p>
{:else if $speakers.error}
<p>Oh no... {$speakers.error.message}</p>
{:else}
<ul>
  {#each $speakers.data.speakers.data as speaker}
  <li>
    <span>{speaker.firstname} {speaker.lastname}</span>
    <button on:click={() => navigateToProfile(speaker._id)}>View</button>
  </li>
  {/each}
</ul>
{/if}