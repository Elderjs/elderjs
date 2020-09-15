import { ShortcodeDefs } from './utils/types';

const shortcodes: ShortcodeDefs = [
  {
    shortcode: 'svelteComponent',
    run: async ({ props, helpers }) => {
      if (!props.name) throw new Error(`svelteComponent shortcode requires a name="" property.`);
      return {
        html: helpers.inlineSvelteComponent({
          name: props.name,
          props: props.props || {},
          options: props.options || {},
        }),
      };
    },
    $$meta: {
      addedBy: 'elder',
      type: 'elder',
    },
  },
];

export default shortcodes;
