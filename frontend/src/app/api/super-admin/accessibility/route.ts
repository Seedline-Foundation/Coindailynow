import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock accessibility data
    const data = {
      score: {
        overall: 87,
        contrast: 92,
        keyboard: 85,
        screenReader: 88,
        semantics: 82,
        aria: 89,
        multimedia: 95
      },
      issues: [
        {
          id: '1',
          severity: 'critical' as const,
          type: 'color-contrast',
          element: '<button class="btn-primary">Submit</button>',
          description: 'Insufficient color contrast ratio',
          wcagLevel: 'AA' as const,
          wcagCriterion: '1.4.3 Contrast (Minimum)',
          location: '/articles/new - Line 45',
          suggestion: 'Change button background from #4a5568 to #2d3748 or increase text color brightness',
          affectedUsers: 'Users with low vision, color blindness'
        },
        {
          id: '2',
          severity: 'serious' as const,
          type: 'keyboard',
          element: '<div class="dropdown" onclick="toggleMenu()">',
          description: 'Interactive element not keyboard accessible',
          wcagLevel: 'A' as const,
          wcagCriterion: '2.1.1 Keyboard',
          location: '/dashboard - Line 123',
          suggestion: 'Replace div with button element or add tabindex="0" and onKeyPress handler',
          affectedUsers: 'Keyboard-only users, motor impaired users'
        },
        {
          id: '3',
          severity: 'serious' as const,
          type: 'screen-reader',
          element: '<img src="bitcoin-chart.png">',
          description: 'Image missing alt text',
          wcagLevel: 'A' as const,
          wcagCriterion: '1.1.1 Non-text Content',
          location: '/market-analysis - Line 67',
          suggestion: 'Add descriptive alt text: alt="Bitcoin price chart showing upward trend from $40k to $65k"',
          affectedUsers: 'Screen reader users, blind users'
        },
        {
          id: '4',
          severity: 'moderate' as const,
          type: 'aria',
          element: '<div aria-label="Close" role="btn">',
          description: 'Invalid ARIA role value',
          wcagLevel: 'A' as const,
          wcagCriterion: '4.1.2 Name, Role, Value',
          location: '/components/modal.tsx - Line 34',
          suggestion: 'Change role="btn" to role="button" (use valid ARIA role)',
          affectedUsers: 'Assistive technology users'
        },
        {
          id: '5',
          severity: 'moderate' as const,
          type: 'semantics',
          element: '<div class="heading">Article Title</div>',
          description: 'Non-semantic heading element',
          wcagLevel: 'AA' as const,
          wcagCriterion: '1.3.1 Info and Relationships',
          location: '/articles/list - Line 89',
          suggestion: 'Use semantic HTML: <h2>Article Title</h2> instead of div with class',
          affectedUsers: 'Screen reader users, SEO'
        },
        {
          id: '6',
          severity: 'moderate' as const,
          type: 'keyboard',
          element: '<a href="#" onclick="showDetails()">View</a>',
          description: 'Link with no meaningful href',
          wcagLevel: 'A' as const,
          wcagCriterion: '2.1.1 Keyboard',
          location: '/market/tokens - Line 156',
          suggestion: 'Use button element for actions: <button onClick="showDetails()">View</button>',
          affectedUsers: 'Keyboard users, screen reader users'
        },
        {
          id: '7',
          severity: 'minor' as const,
          type: 'color-contrast',
          element: '<span class="text-gray-400">Secondary text</span>',
          description: 'Low contrast on small text',
          wcagLevel: 'AAA' as const,
          wcagCriterion: '1.4.6 Contrast (Enhanced)',
          location: '/dashboard - Line 234',
          suggestion: 'Increase text color to #9ca3af or larger for better readability',
          affectedUsers: 'Users with low vision'
        },
        {
          id: '8',
          severity: 'minor' as const,
          type: 'aria',
          element: '<input type="text" placeholder="Search...">',
          description: 'Form input missing label',
          wcagLevel: 'A' as const,
          wcagCriterion: '3.3.2 Labels or Instructions',
          location: '/search - Line 12',
          suggestion: 'Add aria-label="Search articles" or associate with visible <label> element',
          affectedUsers: 'Screen reader users'
        },
        {
          id: '9',
          severity: 'minor' as const,
          type: 'semantics',
          element: '<div tabindex="0" onKeyPress="..." onClick="...">',
          description: 'Custom interactive element without proper role',
          wcagLevel: 'AA' as const,
          wcagCriterion: '4.1.2 Name, Role, Value',
          location: '/components/card.tsx - Line 78',
          suggestion: 'Add role="button" or use native button element',
          affectedUsers: 'Assistive technology users'
        }
      ],
      contrastChecks: [
        {
          id: '1',
          element: 'Primary Button',
          foreground: '#ffffff',
          background: '#3b82f6',
          ratio: 4.54,
          passed: true,
          level: 'AA' as const,
          location: '/components/button.tsx'
        },
        {
          id: '2',
          element: 'Secondary Text',
          foreground: '#6b7280',
          background: '#ffffff',
          ratio: 3.97,
          passed: false,
          level: 'AA' as const,
          location: '/articles/list'
        },
        {
          id: '3',
          element: 'Success Alert',
          foreground: '#ffffff',
          background: '#10b981',
          ratio: 3.12,
          passed: false,
          level: 'AA' as const,
          location: '/components/alert.tsx'
        },
        {
          id: '4',
          element: 'Navigation Link',
          foreground: '#1f2937',
          background: '#f9fafb',
          ratio: 11.89,
          passed: true,
          level: 'AAA' as const,
          location: '/components/nav.tsx'
        },
        {
          id: '5',
          element: 'Error Message',
          foreground: '#ffffff',
          background: '#ef4444',
          ratio: 4.87,
          passed: true,
          level: 'AA' as const,
          location: '/components/error.tsx'
        }
      ],
      ariaAttributes: [
        {
          id: '1',
          element: '<button aria-label="Close modal">',
          attribute: 'aria-label',
          value: 'Close modal',
          valid: true,
          location: '/components/modal.tsx'
        },
        {
          id: '2',
          element: '<div role="navigation" aria-label="Main">',
          attribute: 'role',
          value: 'navigation',
          valid: true,
          location: '/components/nav.tsx'
        },
        {
          id: '3',
          element: '<input aria-describedby="help-text">',
          attribute: 'aria-describedby',
          value: 'help-text',
          valid: true,
          location: '/forms/login.tsx'
        },
        {
          id: '4',
          element: '<div role="btn" aria-pressed="true">',
          attribute: 'role',
          value: 'btn',
          valid: false,
          issue: 'Invalid ARIA role. Use "button" instead of "btn"',
          location: '/components/toggle.tsx'
        },
        {
          id: '5',
          element: '<nav aria-expanded="maybe">',
          attribute: 'aria-expanded',
          value: 'maybe',
          valid: false,
          issue: 'Invalid value for aria-expanded. Must be "true" or "false"',
          location: '/components/sidebar.tsx'
        },
        {
          id: '6',
          element: '<section aria-labelledby="heading-1">',
          attribute: 'aria-labelledby',
          value: 'heading-1',
          valid: true,
          location: '/articles/detail.tsx'
        }
      ]
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching accessibility data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility data' },
      { status: 500 }
    );
  }
}
