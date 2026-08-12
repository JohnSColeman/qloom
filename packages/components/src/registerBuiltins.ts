/** Registration of the built-in components into the global registry. */
import { Registry } from "@qloom/core";
import { If } from "./If.js";
import { Unless } from "./Unless.js";
import { Loop } from "./Loop.js";
import { Delegate } from "./Delegate.js";
import { EventLink } from "./EventLink.js";
import { PageLink } from "./PageLink.js";
import { Zone } from "./Zone.js";
import { Form } from "./Form.js";
import { TextField } from "./TextField.js";
import { PasswordField } from "./PasswordField.js";
import { Hidden } from "./Hidden.js";
import { Checkbox } from "./Checkbox.js";
import { Checklist } from "./Checklist.js";
import { Palette } from "./Palette.js";
import { TextArea } from "./TextArea.js";
import { Any } from "./Any.js";
import { Output } from "./Output.js";
import { OutputRaw } from "./OutputRaw.js";
import { TextOutput } from "./TextOutput.js";
import { FontAwesomeIcon } from "./FontAwesomeIcon.js";
import { PropertyDisplay } from "./PropertyDisplay.js";
import { PropertyEditor } from "./PropertyEditor.js";
import { BeanEditor } from "./BeanEditor.js";
import { BeanEditForm } from "./BeanEditForm.js";
import { DateField } from "./DateField.js";
import { KaptchaImage } from "./KaptchaImage.js";
import { KaptchaField } from "./KaptchaField.js";
import { Select } from "./Select.js";
import { RadioGroup } from "./RadioGroup.js";
import { Radio } from "./Radio.js";
import { Label } from "./Label.js";
import { Errors } from "./Errors.js";
import { FieldError } from "./FieldError.js";
import { BeanDisplay } from "./BeanDisplay.js";
import { Grid } from "./Grid.js";
import { Submit } from "./Submit.js";
import { LinkSubmit } from "./LinkSubmit.js";
import { FormFragment } from "./FormFragment.js";
import { Tree } from "./Tree.js";
import { Alerts } from "./Alerts.js";
import { LocaleSelector } from "./LocaleSelector.js";
import { DevTool } from "./DevTool.js";
import { Dynamic } from "./Dynamic.js";
import { ProgressiveDisplay } from "./ProgressiveDisplay.js";
import { SubmitNotifier } from "./SubmitNotifier.js";
import { Trigger } from "./Trigger.js";
import { AjaxFormLoop } from "./AjaxFormLoop.js";
import { AddRowLink } from "./AddRowLink.js";
import { RemoveRowLink } from "./RemoveRowLink.js";
import { AjaxLoader } from "./AjaxLoader.js";
import { Confirm } from "./Confirm.js";
import { DiscardBody } from "./DiscardBody.js";
import { RenderDisabled } from "./RenderDisabled.js";
import { EchoValue } from "./EchoValue.js";
import { ZoneRefresh } from "./ZoneRefresh.js";
import { TriggerFragment } from "./TriggerFragment.js";
import { Autocomplete } from "./Autocomplete.js";

/** Register the built-in components into the global registry. */
export function registerBuiltins(): void {
  Registry.registerComponent("if", If);
  Registry.registerComponent("unless", Unless);
  Registry.registerComponent("loop", Loop);
  Registry.registerComponent("delegate", Delegate);
  Registry.registerComponent("eventlink", EventLink);
  Registry.registerComponent("actionlink", EventLink); // ActionLink = EventLink with event "action"
  Registry.registerComponent("pagelink", PageLink);
  Registry.registerComponent("zone", Zone);
  Registry.registerComponent("form", Form);
  Registry.registerComponent("textfield", TextField);
  Registry.registerComponent("passwordfield", PasswordField);
  Registry.registerComponent("hidden", Hidden);
  Registry.registerComponent("checkbox", Checkbox);
  Registry.registerComponent("checklist", Checklist);
  Registry.registerComponent("palette", Palette);
  Registry.registerComponent("textarea", TextArea);
  Registry.registerComponent("any", Any);
  Registry.registerComponent("output", Output);
  Registry.registerComponent("outputraw", OutputRaw);
  Registry.registerComponent("textoutput", TextOutput);
  Registry.registerComponent("fontawesomeicon", FontAwesomeIcon);
  Registry.registerComponent("propertydisplay", PropertyDisplay);
  Registry.registerComponent("propertyeditor", PropertyEditor);
  Registry.registerComponent("beaneditor", BeanEditor);
  Registry.registerComponent("beaneditform", BeanEditForm);
  Registry.registerComponent("datefield", DateField);
  Registry.registerComponent("kaptchaimage", KaptchaImage);
  Registry.registerComponent("kaptchafield", KaptchaField);
  Registry.registerComponent("select", Select);
  Registry.registerComponent("radiogroup", RadioGroup);
  Registry.registerComponent("radio", Radio);
  Registry.registerComponent("label", Label);
  Registry.registerComponent("errors", Errors);
  Registry.registerComponent("error", FieldError);
  Registry.registerComponent("beandisplay", BeanDisplay);
  Registry.registerComponent("grid", Grid);
  Registry.registerComponent("submit", Submit);
  Registry.registerComponent("linksubmit", LinkSubmit);
  Registry.registerComponent("formfragment", FormFragment);
  Registry.registerComponent("tree", Tree);
  Registry.registerComponent("alerts", Alerts);
  Registry.registerComponent("localeselector", LocaleSelector);
  Registry.registerComponent("devtool", DevTool);
  Registry.registerComponent("dynamic", Dynamic);
  Registry.registerComponent("progressivedisplay", ProgressiveDisplay);
  Registry.registerComponent("submitnotifier", SubmitNotifier);
  Registry.registerComponent("trigger", Trigger);
  Registry.registerComponent("ajaxformloop", AjaxFormLoop);
  Registry.registerComponent("addrowlink", AddRowLink);
  Registry.registerComponent("removerowlink", RemoveRowLink);
  Registry.registerComponent("ajaxloader", AjaxLoader);
  // Mixins (attached via t:mixins) — resolved from the registry like components.
  Registry.registerComponent("confirm", Confirm);
  Registry.registerComponent("discardbody", DiscardBody);
  Registry.registerComponent("renderdisabled", RenderDisabled);
  Registry.registerComponent("echovalue", EchoValue);
  Registry.registerComponent("zonerefresh", ZoneRefresh);
  Registry.registerComponent("triggerfragment", TriggerFragment);
  Registry.registerComponent("autocomplete", Autocomplete);
}

/** The set of built-in component ids the compiler resolves against. */
export const BUILTIN_COMPONENT_IDS = [
  "if",
  "unless",
  "loop",
  "delegate",
  "eventlink",
  "actionlink",
  "pagelink",
  "zone",
  "form",
  "textfield",
  "passwordfield",
  "datefield",
  "kaptchaimage",
  "kaptchafield",
  "radiogroup",
  "radio",
  "label",
  "errors",
] as const;
