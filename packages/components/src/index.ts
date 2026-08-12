/**
 * @qloom/components — the built-in component library.
 *
 * Structural, form, output, bean, and grid/tree components ported from the
 * canonical Tapestry source to their exact parameter shapes — minus the
 * server-only form-state plumbing (§3). Behaviour is driven by the render-phase
 * return-value protocol (§7). Install them with `registerBuiltins()`.
 */

// public types
export type { CaptchaChallenge, CaptchaProvider, OptionModel, Alert, Severity } from "./types.js";

// validation (re-exported for convenience)
export { Validators } from "@qloom/validation";

// conditional & looping
export { If } from "./If.js";
export { Unless } from "./Unless.js";
export { Loop } from "./Loop.js";
export { Delegate } from "./Delegate.js";

// links & buttons
export { EventLink } from "./EventLink.js";
export { PageLink } from "./PageLink.js";
export { LinkSubmit } from "./LinkSubmit.js";
export { Submit } from "./Submit.js";

// forms & fields
export { Form } from "./Form.js";
export { TextField } from "./TextField.js";
export { PasswordField } from "./PasswordField.js";
export { Hidden } from "./Hidden.js";
export { Checkbox } from "./Checkbox.js";
export { Checklist } from "./Checklist.js";
export { Palette } from "./Palette.js";
export { TextArea } from "./TextArea.js";
export { DateField } from "./DateField.js";
export { Select } from "./Select.js";
export { SelectModel } from "./SelectModel.js";
export { EnumSelectModel } from "./EnumSelectModel.js";
export { RadioGroup } from "./RadioGroup.js";
export { Radio } from "./Radio.js";
export { Label } from "./Label.js";
export { FormFragment } from "./FormFragment.js";
export { SubmitNotifier } from "./SubmitNotifier.js";
export { Errors } from "./Errors.js";
export { FieldError } from "./FieldError.js";

// captcha (tapestry-kaptcha)
export { KaptchaImage } from "./KaptchaImage.js";
export { KaptchaField } from "./KaptchaField.js";
export { Captcha } from "./Captcha.js";

// bean display & editing
export { BeanDisplay } from "./BeanDisplay.js";
export { BeanEditor } from "./BeanEditor.js";
export { BeanEditForm } from "./BeanEditForm.js";
export { PropertyDisplay } from "./PropertyDisplay.js";
export { PropertyEditor } from "./PropertyEditor.js";

// output & messages
export { Any } from "./Any.js";
export { Output } from "./Output.js";
export { OutputRaw } from "./OutputRaw.js";
export { TextOutput } from "./TextOutput.js";
export { FontAwesomeIcon } from "./FontAwesomeIcon.js";
export { Alerts } from "./Alerts.js";
export { AlertStorage } from "./AlertStorage.js";
export { LocaleSelector } from "./LocaleSelector.js";
export { Dynamic } from "./Dynamic.js";
export { Trigger } from "./Trigger.js";

// grids, tables & trees
export { Grid } from "./Grid.js";
export { Tree } from "./Tree.js";

// ajax
export { Zone } from "./Zone.js";
export { AjaxFormLoop } from "./AjaxFormLoop.js";
export { Confirm } from "./Confirm.js";
export { DiscardBody } from "./DiscardBody.js";
export { RenderDisabled } from "./RenderDisabled.js";
export { EchoValue } from "./EchoValue.js";
export { ZoneRefresh } from "./ZoneRefresh.js";
export { TriggerFragment } from "./TriggerFragment.js";
export { Autocomplete } from "./Autocomplete.js";
export { AddRowLink } from "./AddRowLink.js";
export { RemoveRowLink } from "./RemoveRowLink.js";
export { ProgressiveDisplay } from "./ProgressiveDisplay.js";
export { AjaxLoader } from "./AjaxLoader.js";

// misc / dev
export { DevTool } from "./DevTool.js";

// registration
export { registerBuiltins, BUILTIN_COMPONENT_IDS } from "./registerBuiltins.js";
