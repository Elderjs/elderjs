<script>
import Two from '../layouts/Two.svelte'
</script>
<style>
  .component {
    display: flex;
    flex-direction: column;
    font-size: 14px;
  }
  @media (min-width: 768px) {
    .component {
      flex-direction: row;
    }
    .component-format {
      min-width: 65px;
      margin-right: 1rem;
    }
  }
</style>

<Two />

<div class="component">test</div>