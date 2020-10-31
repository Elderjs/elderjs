import { ShortcodeDefs } from './types';

const shortcodes: ShortcodeDefs = [
  {
    shortcode: 'svelteComponent',
    run: async ({ props, helpers }) => {
      if (!props.name) throw new Error(`svelteComponent shortcode requires a name="" property.`);

      let parsedProps = {};
      try {
        parsedProps = JSON.parse(props.props);
      } catch {
        console.error(
          `Can't parse ${props.name} svelteComponent props=${props.props} to JSON. It needs to be serializable.`,
        );
      }

      let parsedOptions = {};
      try {
        parsedOptions = JSON.parse(props.options);
      } catch {
        console.error(
          `Can't parse ${props.name} svelteComponent options=${props.options} to JSON. It needs to be serializable.`,
        );
      }
      return {
        html: helpers.inlineSvelteComponent({
          name: props.name,
          props: parsedProps,
          options: parsedOptions,
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
