<script>
  import { page } from '$app/stores';
  import Comments from '$lib/Comments.svelte'
  import { setClient } from '@urql/svelte';
	import { operationStore, query } from '@urql/svelte';
  import client from '../../_client'
  setClient(client);
  
  const currentTalk = operationStore(`
    query GetTalk($id: ID!) {
      findTalkByID(id: $id) {
        _id
        title
        description
        video_url
        speaker {
          firstname
          lastname
          picture
        }
      }
    }
  `,
  { id: $page.params.id }
  )
	query(currentTalk);
</script>

<slot></slot>

{#if $currentTalk.fetching}
<p>Loading...</p>
{:else}
<h1>{$currentTalk.data.findTalkByID.title}</h1>
<p>{$currentTalk.data.findTalkByID.description}</p>
<!-- svelte-ignore a11y-missing-attribute -->
<iframe width="420" height="315" src={`https://www.youtube.com/embed/${$currentTalk.data.findTalkByID.video_url}`}></iframe>

<Comments comments={[]}/>
{/if}