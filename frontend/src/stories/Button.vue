<template>
  <button
    type="button"
    :class="[
      'inline-block cursor-pointer border-0 rounded-[3em] font-bold leading-none font-[\'Nunito Sans\',\'Helvetica Neue\',Helvetica,Arial,sans-serif]',
      props.primary
        ? 'bg-[#555ab9] text-white'
        : 'shadow-[rgba(0,0,0,0.15)_0px_0px_0px_1px_inset] bg-transparent text-[#333]',
      props.size === 'small'
        ? 'px-4 py-2.5 text-xs'
        : props.size === 'large'
          ? 'px-6 py-3 text-base'
          : 'px-5 py-[11px] text-sm',
    ]"
    @click="onClick"
    :style="props.backgroundColor ? { backgroundColor: props.backgroundColor } : {}"
  >
    {{ label }}
  </button>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'StoryButton'
})

const props = withDefaults(
  defineProps<{
    /**
     * The label of the button
     */
    label: string;
    /**
     * primary or secondary button
     */
    primary?: boolean;
    /**
     * size of the button
     */
    size?: 'small' | 'medium' | 'large';
    /**
     * background color of the button
     */
    backgroundColor?: string;
  }>(),
  { primary: false }
);

const emit = defineEmits<{
  (e: 'click', id: number): void;
}>();

const onClick = () => {
  emit('click', 1);
};
</script>
