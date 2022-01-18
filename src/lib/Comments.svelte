<script>
  export let comments;

  console.log(comments);
</script>

<div class="wrap">
  <input placeholder="Write Comment" class="input"/>
  <button class="button is-light">Submit</button>
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    max-width: 300px;
  }
  input {
    max-width: 300px;
    margin-bottom: 20px;
  }
</style>