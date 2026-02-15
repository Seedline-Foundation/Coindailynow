<?php
/**
 * Plugin Name: SENDPRESS by Coindaily
 * Plugin URI: https://press.coindaily.online
 * Description: Integrate SENDPRESS PR distribution SDK into your WordPress site. Earn JOY tokens by displaying PRs.
 * Version: 1.0.0
 * Author: Coindaily
 * Author URI: https://coindaily.online
 * License: MIT
 * Text Domain: sendpress
 */

// Load WordPress function stubs for IDE support during development.
// In production WordPress defines these functions natively.
if (!defined('ABSPATH') && file_exists(__DIR__ . '/stubs.php')) {
    require_once __DIR__ . '/stubs.php';
}

if (!defined('ABSPATH')) {
    exit;
}

define('SENDPRESS_VERSION', '1.0.0');
define('SENDPRESS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SENDPRESS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SENDPRESS_API_URL', 'https://api.press.coindaily.online');
define('SENDPRESS_SDK_URL', 'https://cdn.press.coindaily.online/sdk/sendpress.min.js');

class SendPress_Plugin {
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_sdk'));
        add_action('wp_footer', array($this, 'render_sdk_init'));
        
        // Shortcodes
        add_shortcode('sendpress_pr', array($this, 'shortcode_pr'));
        add_shortcode('sendpress_feed', array($this, 'shortcode_feed'));
        
        // REST API endpoints
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        
        // Gutenberg block
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor'));
    }
    
    public function init() {
        load_plugin_textdomain('sendpress', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Admin menu
     */
    public function admin_menu() {
        add_options_page(
            __('SENDPRESS Settings', 'sendpress'),
            __('SENDPRESS', 'sendpress'),
            'manage_options',
            'sendpress',
            array($this, 'settings_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('sendpress_options', 'sendpress_partner_id');
        register_setting('sendpress_options', 'sendpress_wallet_address');
        register_setting('sendpress_options', 'sendpress_display_mode');
        register_setting('sendpress_options', 'sendpress_positions');
        register_setting('sendpress_options', 'sendpress_auto_display');
        
        add_settings_section(
            'sendpress_main',
            __('Main Settings', 'sendpress'),
            array($this, 'section_main_callback'),
            'sendpress'
        );
        
        add_settings_field(
            'sendpress_partner_id',
            __('Partner ID', 'sendpress'),
            array($this, 'field_partner_id'),
            'sendpress',
            'sendpress_main'
        );
        
        add_settings_field(
            'sendpress_wallet_address',
            __('Wallet Address', 'sendpress'),
            array($this, 'field_wallet_address'),
            'sendpress',
            'sendpress_main'
        );
        
        add_settings_field(
            'sendpress_display_mode',
            __('Display Mode', 'sendpress'),
            array($this, 'field_display_mode'),
            'sendpress',
            'sendpress_main'
        );
    }
    
    public function section_main_callback() {
        echo '<p>' . __('Configure your SENDPRESS integration settings below.', 'sendpress') . '</p>';
    }
    
    public function field_partner_id() {
        $value = get_option('sendpress_partner_id', '');
        echo '<input type="text" name="sendpress_partner_id" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<p class="description">' . __('Your unique Partner ID from the SENDPRESS dashboard.', 'sendpress') . '</p>';
    }
    
    public function field_wallet_address() {
        $value = get_option('sendpress_wallet_address', '');
        echo '<input type="text" name="sendpress_wallet_address" value="' . esc_attr($value) . '" class="regular-text" placeholder="0x..." />';
        echo '<p class="description">' . __('Your Polygon wallet address for receiving JOY token payments.', 'sendpress') . '</p>';
    }
    
    public function field_display_mode() {
        $value = get_option('sendpress_display_mode', 'card');
        ?>
        <select name="sendpress_display_mode">
            <option value="card" <?php selected($value, 'card'); ?>><?php _e('Card (with redirect)', 'sendpress'); ?></option>
            <option value="full" <?php selected($value, 'full'); ?>><?php _e('Full Article', 'sendpress'); ?></option>
            <option value="auto" <?php selected($value, 'auto'); ?>><?php _e('Auto (SDK decides)', 'sendpress'); ?></option>
        </select>
        <?php
    }
    
    /**
     * Settings page HTML
     */
    public function settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <div class="sendpress-status">
                <?php $this->render_connection_status(); ?>
            </div>
            
            <form action="options.php" method="post">
                <?php
                settings_fields('sendpress_options');
                do_settings_sections('sendpress');
                submit_button(__('Save Settings', 'sendpress'));
                ?>
            </form>
            
            <hr />
            
            <h2><?php _e('Quick Start', 'sendpress'); ?></h2>
            <p><?php _e('Use these shortcodes to display PRs:', 'sendpress'); ?></p>
            <code>[sendpress_pr id="PR_ID"]</code> - <?php _e('Display a specific PR', 'sendpress'); ?><br />
            <code>[sendpress_feed count="5"]</code> - <?php _e('Display a PR feed', 'sendpress'); ?>
            
            <hr />
            
            <h2><?php _e('Earnings', 'sendpress'); ?></h2>
            <?php $this->render_earnings_summary(); ?>
        </div>
        <?php
    }
    
    /**
     * Render connection status
     */
    private function render_connection_status() {
        $partner_id = get_option('sendpress_partner_id');
        if (empty($partner_id)) {
            echo '<div class="notice notice-warning"><p>' . __('Please enter your Partner ID to connect.', 'sendpress') . '</p></div>';
            return;
        }
        
        // Check API connection
        $response = wp_remote_get(SENDPRESS_API_URL . '/sites/' . $partner_id . '/verify');
        
        if (is_wp_error($response)) {
            echo '<div class="notice notice-error"><p>' . __('Unable to connect to SENDPRESS API.', 'sendpress') . '</p></div>';
            return;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (!empty($body['verified'])) {
            echo '<div class="notice notice-success"><p>' . 
                 sprintf(__('Connected! Your site is verified as %s tier (DH: %s).', 'sendpress'), 
                         $body['tier'] ?? 'unknown', 
                         $body['dh_score'] ?? 'N/A') . 
                 '</p></div>';
        } else {
            echo '<div class="notice notice-warning"><p>' . __('Site pending verification.', 'sendpress') . '</p></div>';
        }
    }
    
    /**
     * Render earnings summary
     */
    private function render_earnings_summary() {
        $partner_id = get_option('sendpress_partner_id');
        if (empty($partner_id)) {
            echo '<p>' . __('Connect your site to view earnings.', 'sendpress') . '</p>';
            return;
        }
        
        // TODO: Fetch from API
        ?>
        <table class="widefat">
            <thead>
                <tr>
                    <th><?php _e('Period', 'sendpress'); ?></th>
                    <th><?php _e('PRs Displayed', 'sendpress'); ?></th>
                    <th><?php _e('Earned (JOY)', 'sendpress'); ?></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><?php _e('This Month', 'sendpress'); ?></td>
                    <td>-</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td><?php _e('All Time', 'sendpress'); ?></td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            </tbody>
        </table>
        <?php
    }
    
    /**
     * Enqueue SDK on frontend
     */
    public function enqueue_sdk() {
        $partner_id = get_option('sendpress_partner_id');
        if (empty($partner_id)) {
            return;
        }
        
        wp_enqueue_script(
            'sendpress-sdk',
            SENDPRESS_SDK_URL,
            array(),
            SENDPRESS_VERSION,
            true
        );
    }
    
    /**
     * Initialize SDK in footer
     */
    public function render_sdk_init() {
        $partner_id = get_option('sendpress_partner_id');
        if (empty($partner_id)) {
            return;
        }
        
        $mode = get_option('sendpress_display_mode', 'card');
        ?>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof SendPress !== 'undefined') {
                window.sendpress = new SendPress('<?php echo esc_js($partner_id); ?>', {
                    mode: '<?php echo esc_js(strtoupper($mode)); ?>',
                    apiUrl: '<?php echo esc_js(SENDPRESS_API_URL); ?>'
                });
            }
        });
        </script>
        <?php
    }
    
    /**
     * Shortcode: Display single PR
     */
    public function shortcode_pr($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
            'mode' => 'card',
            'theme' => 'light'
        ), $atts);
        
        if (empty($atts['id'])) {
            return '<!-- SENDPRESS: No PR ID specified -->';
        }
        
        $mode = $atts['mode'] === 'full' ? 'coindaily-pr-full' : 'coindaily-pr-card';
        
        return sprintf(
            '<%s pr-id="%s" theme="%s"></%s>',
            $mode,
            esc_attr($atts['id']),
            esc_attr($atts['theme']),
            $mode
        );
    }
    
    /**
     * Shortcode: Display PR feed
     */
    public function shortcode_feed($atts) {
        $atts = shortcode_atts(array(
            'count' => 5,
            'category' => '',
            'mode' => 'card'
        ), $atts);
        
        return sprintf(
            '<coindaily-pr-container count="%d" category="%s" mode="%s"></coindaily-pr-container>',
            intval($atts['count']),
            esc_attr($atts['category']),
            esc_attr($atts['mode'])
        );
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('sendpress/v1', '/webhook', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_webhook'),
            'permission_callback' => array($this, 'verify_webhook')
        ));
        
        register_rest_route('sendpress/v1', '/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_stats'),
            'permission_callback' => '__return_true'
        ));
    }
    
    /**
     * Handle incoming webhooks
     */
    public function handle_webhook($request) {
        $data = $request->get_json_params();
        $event = $data['event'] ?? '';
        
        switch ($event) {
            case 'pr.distribute':
                // New PR to display
                do_action('sendpress_pr_received', $data['pr']);
                break;
                
            case 'payment.received':
                // Payment confirmed
                do_action('sendpress_payment_received', $data['payment']);
                break;
                
            case 'verification.complete':
                // Site verification status changed
                update_option('sendpress_verified', $data['verified']);
                break;
        }
        
        return new WP_REST_Response(array('status' => 'ok'), 200);
    }
    
    /**
     * Verify webhook signature
     */
    public function verify_webhook($request) {
        $signature = $request->get_header('X-SendPress-Signature');
        $body = $request->get_body();
        $secret = get_option('sendpress_webhook_secret', '');
        
        if (empty($secret)) {
            return true; // Skip verification if no secret configured
        }
        
        $expected = hash_hmac('sha256', $body, $secret);
        return hash_equals($expected, $signature);
    }
    
    /**
     * Get site stats
     */
    public function get_stats($request) {
        // Return basic stats for SDK verification
        return new WP_REST_Response(array(
            'partner_id' => get_option('sendpress_partner_id'),
            'plugin_version' => SENDPRESS_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'sdk_installed' => true
        ), 200);
    }
    
    /**
     * Enqueue block editor assets
     */
    public function enqueue_block_editor() {
        wp_enqueue_script(
            'sendpress-block',
            SENDPRESS_PLUGIN_URL . 'blocks/sendpress-block.js',
            array('wp-blocks', 'wp-element', 'wp-editor'),
            SENDPRESS_VERSION
        );
    }
}

// Initialize plugin
SendPress_Plugin::get_instance();

// Activation hook
register_activation_hook(__FILE__, function() {
    // Set default options
    add_option('sendpress_display_mode', 'card');
    add_option('sendpress_auto_display', false);
    
    // Flush rewrite rules
    flush_rewrite_rules();
});

// Deactivation hook
register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});
