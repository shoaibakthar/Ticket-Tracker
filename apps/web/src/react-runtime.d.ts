declare module "react" {
  export type Key = string | number;

  export interface ReactElement<Props = Record<string, unknown>> {
    readonly type: unknown;
    readonly props: Props & { readonly children?: ReactNode };
    readonly key: Key | null;
  }

  export type ReactNode =
    | ReactElement
    | string
    | number
    | boolean
    | null
    | undefined
    | readonly ReactNode[];

  export interface FunctionComponent<Props = Record<string, unknown>> {
    (props: Props): ReactElement | null;
  }

  export function createElement<Props>(
    type: string | FunctionComponent<Props>,
    props?: (Props & Record<string, unknown>) | null,
    ...children: readonly ReactNode[]
  ): ReactElement;
}

declare module "react-dom/server" {
  export function renderToStaticMarkup(element: import("react").ReactElement): string;
}
