declare const svelteComponent: (componentName: any) => ({ page, props, hydrate }: {
    page: any;
    props: any;
    hydrate?: number;
}) => string;
export default svelteComponent;
