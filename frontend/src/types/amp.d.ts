declare global {
  namespace JSX {
    interface IntrinsicElements {
      'amp-img': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src: string;
          width: string | number;
          height: string | number;
          layout?: 'responsive' | 'fixed' | 'fill' | 'flex-item' | 'intrinsic';
          alt?: string;
          'object-fit'?: string;
          'object-position'?: string;
        },
        HTMLElement
      >;
      'amp-social-share': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          type: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'email';
          width: string | number;
          height: string | number;
          'data-param-text'?: string;
          'data-param-url'?: string;
          'data-param-href'?: string;
          'data-param-title'?: string;
        },
        HTMLElement
      >;
      'amp-analytics': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          type?: string;
          'data-credentials'?: string;
          config?: string;
        },
        HTMLElement
      >;
      'amp-ad': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          width: string | number;
          height: string | number;
          type: string;
          'data-ad-client'?: string;
          'data-ad-slot'?: string;
        },
        HTMLElement
      >;
      'amp-carousel': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          width: string | number;
          height: string | number;
          layout?: string;
          type?: 'slides' | 'carousel';
          autoplay?: boolean;
          delay?: number;
        },
        HTMLElement
      >;
      'amp-sidebar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          id: string;
          layout?: string;
          side?: 'left' | 'right';
        },
        HTMLElement
      >;
      'amp-accordion': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'disable-session-states'?: boolean;
          'expand-single-section'?: boolean;
        },
        HTMLElement
      >;
      'amp-form': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      'amp-list': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src: string;
          width: string | number;
          height: string | number;
          layout?: string;
          template?: string;
        },
        HTMLElement
      >;
      'amp-mustache': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export {};