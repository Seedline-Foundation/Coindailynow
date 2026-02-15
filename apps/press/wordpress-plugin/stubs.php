<?php
/**
 * Stubs for WordPress functions to silence IDE errors.
 * This file is for development only and should not be deployed.
 *
 * @phpcs:disable
 */

// ── Core hooks ──────────────────────────────────────────────────────────
if (!function_exists('add_action')) {
    function add_action($tag, $function_to_add, $priority = 10, $accepted_args = 1) {}
}
if (!function_exists('do_action')) {
    function do_action($tag, ...$args) {}
}
if (!function_exists('add_shortcode')) {
    function add_shortcode($tag, $callback) {}
}
if (!function_exists('register_activation_hook')) {
    function register_activation_hook($file, $function) {}
}
if (!function_exists('register_deactivation_hook')) {
    function register_deactivation_hook($file, $function) {}
}

// ── Plugin helpers ──────────────────────────────────────────────────────
if (!function_exists('plugin_dir_path')) {
    function plugin_dir_path($file) { return ''; }
}
if (!function_exists('plugin_dir_url')) {
    function plugin_dir_url($file) { return ''; }
}
if (!function_exists('plugin_basename')) {
    function plugin_basename($file) { return ''; }
}

// ── i18n ────────────────────────────────────────────────────────────────
if (!function_exists('load_plugin_textdomain')) {
    function load_plugin_textdomain($domain, $deprecated = false, $plugin_rel_path = false) {}
}
if (!function_exists('__')) {
    function __($text, $domain = 'default') { return $text; }
}
if (!function_exists('_e')) {
    function _e($text, $domain = 'default') { echo $text; }
}

// ── Settings API ────────────────────────────────────────────────────────
if (!function_exists('add_options_page')) {
    function add_options_page($page_title, $menu_title, $capability, $menu_slug, $function = '', $position = null) {}
}
if (!function_exists('register_setting')) {
    function register_setting($option_group, $option_name, $args = array()) {}
}
if (!function_exists('add_settings_section')) {
    function add_settings_section($id, $title, $callback, $page) {}
}
if (!function_exists('add_settings_field')) {
    function add_settings_field($id, $title, $callback, $page, $section = 'default', $args = array()) {}
}
if (!function_exists('settings_fields')) {
    function settings_fields($option_group) {}
}
if (!function_exists('do_settings_sections')) {
    function do_settings_sections($page) {}
}
if (!function_exists('submit_button')) {
    function submit_button($text = null, $type = 'primary', $name = 'submit', $wrap = true, $other_attributes = null) {}
}

// ── Options ─────────────────────────────────────────────────────────────
if (!function_exists('get_option')) {
    function get_option($option, $default = false) { return $default; }
}
if (!function_exists('update_option')) {
    function update_option($option, $value, $autoload = null) { return true; }
}
if (!function_exists('add_option')) {
    function add_option($option, $value = '', $deprecated = '', $autoload = 'yes') { return true; }
}

// ── Escaping / sanitisation ─────────────────────────────────────────────
if (!function_exists('esc_attr')) {
    function esc_attr($text) { return $text; }
}
if (!function_exists('esc_html')) {
    function esc_html($text) { return $text; }
}
if (!function_exists('esc_js')) {
    function esc_js($text) { return $text; }
}
if (!function_exists('selected')) {
    function selected($selected, $current = true, $echo = true) {}
}
if (!function_exists('shortcode_atts')) {
    function shortcode_atts($pairs, $atts, $shortcode = '') { return array_merge($pairs, (array)$atts); }
}

// ── Users / capabilities ────────────────────────────────────────────────
if (!function_exists('current_user_can')) {
    function current_user_can($capability, ...$args) { return true; }
}

// ── Admin UI ────────────────────────────────────────────────────────────
if (!function_exists('get_admin_page_title')) {
    function get_admin_page_title() { return ''; }
}
if (!function_exists('get_bloginfo')) {
    function get_bloginfo($show = '', $filter = 'raw') { return ''; }
}

// ── Scripts / styles ────────────────────────────────────────────────────
if (!function_exists('wp_enqueue_script')) {
    function wp_enqueue_script($handle, $src = '', $deps = array(), $ver = false, $in_footer = false) {}
}

// ── HTTP API ────────────────────────────────────────────────────────────
if (!function_exists('wp_remote_get')) {
    function wp_remote_get($url, $args = array()) { return array(); }
}
if (!function_exists('wp_remote_retrieve_body')) {
    function wp_remote_retrieve_body($response) { return ''; }
}
if (!function_exists('is_wp_error')) {
    function is_wp_error($thing) { return false; }
}

// ── REST API ────────────────────────────────────────────────────────────
if (!function_exists('register_rest_route')) {
    function register_rest_route($namespace, $route, $args = array(), $override = false) {}
}
if (!class_exists('WP_REST_Response')) {
    class WP_REST_Response {
        public function __construct($data = null, $status = 200, $headers = array()) {}
    }
}

// ── Rewrite ─────────────────────────────────────────────────────────────
if (!function_exists('flush_rewrite_rules')) {
    function flush_rewrite_rules($hard = true) {}
}
