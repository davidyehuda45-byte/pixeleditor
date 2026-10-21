let counter = 0;
const randomPart = () => Math.floor(Math.random() * 0x100000).toString(36);

/** Short, collision-resistant-enough id for frames/layers/cels. */
export function uid(prefix = 'x') {
  counter = (counter + 1) & 0xffff;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${randomPart()}`;
}
