import { InfoPopover } from './InfoPopover';

/**
 * Educational "what is this?" affordance. Renders a small right-aligned
 * "?" icon that opens the concept in a popup, so it stays out of the way
 * instead of filling the page. The {title, body} API is unchanged, so
 * every existing call site picks up the new behavior for free.
 */
export function Explainer({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex justify-end">
      <InfoPopover title={title} body={body} />
    </div>
  );
}
