/**
 * App icon registry: short app name -> Fluent System Icons raw SVG (MIT).
 * Each entry has a 20 px "regular" SVG. App bar icons also have a 24 px one.
 *
 * Migration guide (mdi-* -> app name):
 *   mdi-close                  -> dismiss
 *   mdi-plus                   -> add
 *   mdi-delete, -delete-outline -> delete
 *   mdi-arrow-left             -> back
 *   mdi-pin-outline            -> pin (unpin = pin off)
 *   mdi-chevron-right / -down  -> chevronRight / chevronDown
 *   mdi-information-outline    -> info
 *   mdi-lan-connect            -> connect
 *   mdi-lan-disconnect         -> disconnect
 *   mdi-lan-pending            -> connecting
 *   mdi-white-balance-sunny    -> sun
 *   mdi-moon-waning-crescent   -> moon
 *   mdi-tune-variant           -> options
 *   mdi-sync, mdi-refresh      -> sync
 *   mdi-restore                -> reset
 *   mdi-regex                  -> regex
 *   mdi-format-letter-case     -> matchCase
 *   mdi-format-letter-matches  -> wholeWord
 *   mdi-equal                  -> exactMatch
 *   mdi-record-rec             -> record
 *   mdi-lightning-bolt         -> flash
 *   mdi-folder-open-outline    -> folderOpen
 *   mdi-eye / mdi-eye-off      -> eye / eyeOff
 *   mdi-bug                    -> bug
 *   New UI only: more, edit, settings, search, notifications, document
 */
import addRaw20 from "@fluentui/svg-icons/icons/add_20_regular.svg?raw";
import addRaw24 from "@fluentui/svg-icons/icons/add_24_regular.svg?raw";
import alertRaw20 from "@fluentui/svg-icons/icons/alert_20_regular.svg?raw";
import alertRaw24 from "@fluentui/svg-icons/icons/alert_24_regular.svg?raw";
import arrowLeftRaw20 from "@fluentui/svg-icons/icons/arrow_left_20_regular.svg?raw";
import arrowLeftRaw24 from "@fluentui/svg-icons/icons/arrow_left_24_regular.svg?raw";
import arrowResetRaw20 from "@fluentui/svg-icons/icons/arrow_reset_20_regular.svg?raw";
import arrowSyncRaw20 from "@fluentui/svg-icons/icons/arrow_sync_20_regular.svg?raw";
import bugRaw20 from "@fluentui/svg-icons/icons/bug_20_regular.svg?raw";
import checkmarkRaw20 from "@fluentui/svg-icons/icons/checkmark_20_regular.svg?raw";
import chevronDownRaw20 from "@fluentui/svg-icons/icons/chevron_down_20_regular.svg?raw";
import chevronRightRaw20 from "@fluentui/svg-icons/icons/chevron_right_20_regular.svg?raw";
import codeRaw20 from "@fluentui/svg-icons/icons/code_20_regular.svg?raw";
import deleteRaw20 from "@fluentui/svg-icons/icons/delete_20_regular.svg?raw";
import deleteRaw24 from "@fluentui/svg-icons/icons/delete_24_regular.svg?raw";
import dismissRaw20 from "@fluentui/svg-icons/icons/dismiss_20_regular.svg?raw";
import dismissRaw24 from "@fluentui/svg-icons/icons/dismiss_24_regular.svg?raw";
import documentRaw20 from "@fluentui/svg-icons/icons/document_20_regular.svg?raw";
import documentRaw24 from "@fluentui/svg-icons/icons/document_24_regular.svg?raw";
import editRaw20 from "@fluentui/svg-icons/icons/edit_20_regular.svg?raw";
import editRaw24 from "@fluentui/svg-icons/icons/edit_24_regular.svg?raw";
import equalCircleRaw20 from "@fluentui/svg-icons/icons/equal_circle_20_regular.svg?raw";
import eyeOffRaw20 from "@fluentui/svg-icons/icons/eye_off_20_regular.svg?raw";
import eyeRaw20 from "@fluentui/svg-icons/icons/eye_20_regular.svg?raw";
import flashRaw20 from "@fluentui/svg-icons/icons/flash_20_regular.svg?raw";
import folderOpenRaw20 from "@fluentui/svg-icons/icons/folder_open_20_regular.svg?raw";
import infoRaw20 from "@fluentui/svg-icons/icons/info_20_regular.svg?raw";
import moreHorizontalRaw20 from "@fluentui/svg-icons/icons/more_horizontal_20_regular.svg?raw";
import moreHorizontalRaw24 from "@fluentui/svg-icons/icons/more_horizontal_24_regular.svg?raw";
import networkCheckRaw20 from "@fluentui/svg-icons/icons/network_check_20_regular.svg?raw";
import optionsRaw20 from "@fluentui/svg-icons/icons/options_20_regular.svg?raw";
import pinOffRaw20 from "@fluentui/svg-icons/icons/pin_off_20_regular.svg?raw";
import pinOffRaw24 from "@fluentui/svg-icons/icons/pin_off_24_regular.svg?raw";
import pinRaw20 from "@fluentui/svg-icons/icons/pin_20_regular.svg?raw";
import pinRaw24 from "@fluentui/svg-icons/icons/pin_24_regular.svg?raw";
import plugConnectedRaw20 from "@fluentui/svg-icons/icons/plug_connected_20_regular.svg?raw";
import plugConnectedRaw24 from "@fluentui/svg-icons/icons/plug_connected_24_regular.svg?raw";
import plugDisconnectedRaw20 from "@fluentui/svg-icons/icons/plug_disconnected_20_regular.svg?raw";
import plugDisconnectedRaw24 from "@fluentui/svg-icons/icons/plug_disconnected_24_regular.svg?raw";
import recordRaw20 from "@fluentui/svg-icons/icons/record_20_regular.svg?raw";
import searchRaw20 from "@fluentui/svg-icons/icons/search_20_regular.svg?raw";
import searchRaw24 from "@fluentui/svg-icons/icons/search_24_regular.svg?raw";
import settingsRaw20 from "@fluentui/svg-icons/icons/settings_20_regular.svg?raw";
import settingsRaw24 from "@fluentui/svg-icons/icons/settings_24_regular.svg?raw";
import textChangeCaseRaw20 from "@fluentui/svg-icons/icons/text_change_case_20_regular.svg?raw";
import textUnderlineRaw20 from "@fluentui/svg-icons/icons/text_underline_20_regular.svg?raw";
import weatherMoonRaw20 from "@fluentui/svg-icons/icons/weather_moon_20_regular.svg?raw";
import weatherSunnyRaw20 from "@fluentui/svg-icons/icons/weather_sunny_20_regular.svg?raw";

/** @type {Record<string, {20: string, 24?: string}>} */
export const ICONS = {
  add: { 20: addRaw20, 24: addRaw24 },
  back: { 20: arrowLeftRaw20, 24: arrowLeftRaw24 },
  bug: { 20: bugRaw20 },
  check: { 20: checkmarkRaw20 },
  chevronDown: { 20: chevronDownRaw20 },
  chevronRight: { 20: chevronRightRaw20 },
  connect: { 20: plugConnectedRaw20, 24: plugConnectedRaw24 },
  connecting: { 20: networkCheckRaw20 },
  delete: { 20: deleteRaw20, 24: deleteRaw24 },
  disconnect: { 20: plugDisconnectedRaw20, 24: plugDisconnectedRaw24 },
  dismiss: { 20: dismissRaw20, 24: dismissRaw24 },
  document: { 20: documentRaw20, 24: documentRaw24 },
  edit: { 20: editRaw20, 24: editRaw24 },
  exactMatch: { 20: equalCircleRaw20 },
  eye: { 20: eyeRaw20 },
  eyeOff: { 20: eyeOffRaw20 },
  flash: { 20: flashRaw20 },
  folderOpen: { 20: folderOpenRaw20 },
  info: { 20: infoRaw20 },
  matchCase: { 20: textChangeCaseRaw20 },
  moon: { 20: weatherMoonRaw20 },
  more: { 20: moreHorizontalRaw20, 24: moreHorizontalRaw24 },
  notifications: { 20: alertRaw20, 24: alertRaw24 },
  options: { 20: optionsRaw20 },
  pin: { 20: pinRaw20, 24: pinRaw24 },
  record: { 20: recordRaw20 },
  regex: { 20: codeRaw20 },
  reset: { 20: arrowResetRaw20 },
  search: { 20: searchRaw20, 24: searchRaw24 },
  settings: { 20: settingsRaw20, 24: settingsRaw24 },
  sun: { 20: weatherSunnyRaw20 },
  sync: { 20: arrowSyncRaw20 },
  unpin: { 20: pinOffRaw20, 24: pinOffRaw24 },
  wholeWord: { 20: textUnderlineRaw20 },
};
