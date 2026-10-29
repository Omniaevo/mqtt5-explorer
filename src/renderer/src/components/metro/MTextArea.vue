<template>
  <div
    class="m-field"
    :class="[
      $attrs.class,
      { 'm-field--error': error, 'm-field--disabled': disabled },
    ]"
    :style="$attrs.style"
  >
    <label v-if="label" class="m-field__label" :for="id">{{ label }}</label>
    <div class="m-field__box">
      <textarea
        :id="id"
        ref="areaRef"
        v-model="model"
        class="m-field__input m-text-area__input"
        v-bind="areaAttrs()"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : undefined"
      />
    </div>
    <p v-if="error" :id="errorId" class="m-field__error">{{ error }}</p>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, useAttrs, useId, watch } from "vue";
import { withoutClassAndStyle } from "./forwardAttrs";
import "./field.css";

/**
 * Metro multi-line text box. Same look as MTextBox.
 * With autoGrow the height follows the content.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps({
  label: { type: String, default: "" },
  rows: { type: Number, default: 3 },
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  autoGrow: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const model = defineModel({ type: String, default: "" });

const attrs = useAttrs();
const id = useId();
const errorId = `${id}-error`;
const areaRef = ref(null);

const areaAttrs = () => withoutClassAndStyle(attrs);

const grow = async () => {
  await nextTick();
  const area = areaRef.value;
  if (!props.autoGrow || !area) return;
  area.style.height = "auto";
  area.style.height = `${area.scrollHeight}px`;
};

onMounted(grow);
watch(model, grow);
</script>

<style scoped>
.m-text-area__input {
  resize: vertical;
}
</style>
