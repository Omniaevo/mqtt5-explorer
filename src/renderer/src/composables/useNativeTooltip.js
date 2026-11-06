import { onUnmounted } from "vue";

const SHOW_DELAY_MS = 400;

/**
 * Tooltip for the shell. The tab views paint over the shell, so main draws the
 * tooltip in a view of its own. This composable only asks main to show or hide it.
 */
export function useNativeTooltip() {
  const { tooltip } = window.api;
  let timer;
  let requested = false;

  const hide = () => {
    clearTimeout(timer);

    // Only the owner of the tooltip may hide it: another tab may own it now
    if (!requested) return;

    requested = false;
    tooltip.hide();
  };

  /**
   * @param {Element} element Anchor: the tooltip opens below it.
   * @param {{title: string, subtitle?: string}} content
   */
  const show = (element, { title, subtitle }) => {
    clearTimeout(timer);
    requested = true;
    timer = setTimeout(() => {
      const { x, y, width, height } = element.getBoundingClientRect();

      tooltip.show({ title, subtitle, anchor: { x, y, width, height } });
    }, SHOW_DELAY_MS);
  };

  onUnmounted(hide);

  return { show, hide };
}
