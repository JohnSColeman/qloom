import { registerBuiltins } from "@qloom/components";
import { Registry, Zones, Messages } from "@qloom/core";
import { Router } from "@qloom/router";
import messageCatalogues from "virtual:qloom/messages";
import { Index } from "./pages/Index";
import indexTemplate from "./pages/Index.tml";
import { LoopEmpty } from "./pages/LoopEmpty";
import loopEmptyTemplate from "./pages/LoopEmpty.tml";
import { LoopNull } from "./pages/LoopNull";
import loopNullTemplate from "./pages/LoopNull.tml";
import { LoopGeneric } from "./pages/LoopGeneric";
import loopGenericTemplate from "./pages/LoopGeneric.tml";
import { LoopFormDemo } from "./pages/LoopFormDemo";
import loopFormDemoTemplate from "./pages/LoopFormDemo.tml";
import { AjaxLoopSubmitDemo } from "./pages/AjaxLoopSubmitDemo";
import ajaxLoopSubmitDemoTemplate from "./pages/AjaxLoopSubmitDemo.tml";
import { NestedLoopFormDemo } from "./pages/NestedLoopFormDemo";
import nestedLoopFormDemoTemplate from "./pages/NestedLoopFormDemo.tml";
import { ConfirmMixinDemo } from "./pages/ConfirmMixinDemo";
import confirmMixinDemoTemplate from "./pages/ConfirmMixinDemo.tml";
import { ConfirmResult } from "./pages/ConfirmResult";
import confirmResultTemplate from "./pages/ConfirmResult.tml";
import { DiscardBodyDemo } from "./pages/DiscardBodyDemo";
import discardBodyDemoTemplate from "./pages/DiscardBodyDemo.tml";
import { RenderDisabledDemo } from "./pages/RenderDisabledDemo";
import renderDisabledDemoTemplate from "./pages/RenderDisabledDemo.tml";
import { BindParameterDemo } from "./pages/BindParameterDemo";
import bindParameterDemoTemplate from "./pages/BindParameterDemo.tml";
import { EnvironmentalDemo } from "./pages/EnvironmentalDemo";
import environmentalDemoTemplate from "./pages/EnvironmentalDemo.tml";
import { ZoneRefreshDemo } from "./pages/ZoneRefreshDemo";
import zoneRefreshDemoTemplate from "./pages/ZoneRefreshDemo.tml";
import { TriggerFragmentDemo } from "./pages/TriggerFragmentDemo";
import triggerFragmentDemoTemplate from "./pages/TriggerFragmentDemo.tml";
import { AutocompleteDemo } from "./pages/AutocompleteDemo";
import autocompleteDemoTemplate from "./pages/AutocompleteDemo.tml";
import { ClassMixinDemo } from "./pages/ClassMixinDemo";
import classMixinDemoTemplate from "./pages/ClassMixinDemo.tml";
import { DupMixinDemo } from "./pages/DupMixinDemo";
import dupMixinDemoTemplate from "./pages/DupMixinDemo.tml";
import { ReturnProtocolDemo } from "./pages/ReturnProtocolDemo";
import returnProtocolDemoTemplate from "./pages/ReturnProtocolDemo.tml";
import { LifePageA } from "./pages/LifePageA";
import lifePageATemplate from "./pages/LifePageA.tml";
import { LifePageB } from "./pages/LifePageB";
import lifePageBTemplate from "./pages/LifePageB.tml";
import { LifeConvention } from "./pages/LifeConvention";
import lifeConventionTemplate from "./pages/LifeConvention.tml";
import { LifeRedirect } from "./pages/LifeRedirect";
import lifeRedirectTemplate from "./pages/LifeRedirect.tml";
import { LifeTimer } from "./pages/LifeTimer";
import lifeTimerTemplate from "./pages/LifeTimer.tml";
import { IfUnless } from "./pages/IfUnless";
import ifUnlessTemplate from "./pages/IfUnless.tml";
import { ZoneDemo } from "./pages/ZoneDemo";
import zoneDemoTemplate from "./pages/ZoneDemo.tml";
import { CheckboxDemo } from "./pages/CheckboxDemo";
import checkboxDemoTemplate from "./pages/CheckboxDemo.tml";
import { CheckboxResult } from "./pages/CheckboxResult";
import checkboxResultTemplate from "./pages/CheckboxResult.tml";
import { PageLinkSource } from "./pages/PageLinkSource";
import pageLinkSourceTemplate from "./pages/PageLinkSource.tml";
import { PageLinkTarget } from "./pages/PageLinkTarget";
import pageLinkTargetTemplate from "./pages/PageLinkTarget.tml";
import { TextFieldDemo } from "./pages/TextFieldDemo";
import textFieldDemoTemplate from "./pages/TextFieldDemo.tml";
import { TextFieldResult } from "./pages/TextFieldResult";
import textFieldResultTemplate from "./pages/TextFieldResult.tml";
import { SelectDemo } from "./pages/SelectDemo";
import selectDemoTemplate from "./pages/SelectDemo.tml";
import { SelectResult } from "./pages/SelectResult";
import selectResultTemplate from "./pages/SelectResult.tml";
import { SelectBlankDemo } from "./pages/SelectBlankDemo";
import selectBlankDemoTemplate from "./pages/SelectBlankDemo.tml";
import { RadioDemo } from "./pages/RadioDemo";
import radioDemoTemplate from "./pages/RadioDemo.tml";
import { RadioResult } from "./pages/RadioResult";
import radioResultTemplate from "./pages/RadioResult.tml";
import { DateFieldDemo } from "./pages/DateFieldDemo";
import dateFieldDemoTemplate from "./pages/DateFieldDemo.tml";
import { DateFieldResult } from "./pages/DateFieldResult";
import dateFieldResultTemplate from "./pages/DateFieldResult.tml";
import { PasswordFieldDemo } from "./pages/PasswordFieldDemo";
import passwordFieldDemoTemplate from "./pages/PasswordFieldDemo.tml";
import { PasswordFieldResult } from "./pages/PasswordFieldResult";
import passwordFieldResultTemplate from "./pages/PasswordFieldResult.tml";
import { SubmitDemo } from "./pages/SubmitDemo";
import submitDemoTemplate from "./pages/SubmitDemo.tml";
import { SubmitModeDemo } from "./pages/SubmitModeDemo";
import submitModeDemoTemplate from "./pages/SubmitModeDemo.tml";
import { SubmitResult } from "./pages/SubmitResult";
import submitResultTemplate from "./pages/SubmitResult.tml";
import { LabelDemo } from "./pages/LabelDemo";
import labelDemoTemplate from "./pages/LabelDemo.tml";
import { ErrorsDemo } from "./pages/ErrorsDemo";
import errorsDemoTemplate from "./pages/ErrorsDemo.tml";
import { GridDemo } from "./pages/GridDemo";
import gridDemoTemplate from "./pages/GridDemo.tml";
import { BeanDisplayDemo } from "./pages/BeanDisplayDemo";
import beanDisplayDemoTemplate from "./pages/BeanDisplayDemo.tml";
import { KaptchaDemo } from "./pages/KaptchaDemo";
import kaptchaDemoTemplate from "./pages/KaptchaDemo.tml";
import { TextAreaDemo } from "./pages/TextAreaDemo";
import textAreaDemoTemplate from "./pages/TextAreaDemo.tml";
import { TextAreaResult } from "./pages/TextAreaResult";
import textAreaResultTemplate from "./pages/TextAreaResult.tml";
import { HiddenDemo } from "./pages/HiddenDemo";
import hiddenDemoTemplate from "./pages/HiddenDemo.tml";
import { HiddenResult } from "./pages/HiddenResult";
import hiddenResultTemplate from "./pages/HiddenResult.tml";
import { AnyDemo } from "./pages/AnyDemo";
import anyDemoTemplate from "./pages/AnyDemo.tml";
import { OutputDemo } from "./pages/OutputDemo";
import outputDemoTemplate from "./pages/OutputDemo.tml";
import { OutputRawDemo } from "./pages/OutputRawDemo";
import outputRawDemoTemplate from "./pages/OutputRawDemo.tml";
import { TextOutputDemo } from "./pages/TextOutputDemo";
import textOutputDemoTemplate from "./pages/TextOutputDemo.tml";
import { PaletteDemo } from "./pages/PaletteDemo";
import paletteDemoTemplate from "./pages/PaletteDemo.tml";
import { BeanEditorDemo } from "./pages/BeanEditorDemo";
import beanEditorDemoTemplate from "./pages/BeanEditorDemo.tml";
import { PropertyEditorDemo } from "./pages/PropertyEditorDemo";
import propertyEditorDemoTemplate from "./pages/PropertyEditorDemo.tml";
import { FormFragmentDemo } from "./pages/FormFragmentDemo";
import formFragmentDemoTemplate from "./pages/FormFragmentDemo.tml";
import { ProgressiveDisplayDemo } from "./pages/ProgressiveDisplayDemo";
import progressiveDisplayDemoTemplate from "./pages/ProgressiveDisplayDemo.tml";
import { LinkSubmitDemo } from "./pages/LinkSubmitDemo";
import linkSubmitDemoTemplate from "./pages/LinkSubmitDemo.tml";
import { DoubleSubmitDemo } from "./pages/DoubleSubmitDemo";
import doubleSubmitDemoTemplate from "./pages/DoubleSubmitDemo.tml";
import { LinkSubmitResult } from "./pages/LinkSubmitResult";
import linkSubmitResultTemplate from "./pages/LinkSubmitResult.tml";
import { TreeDemo } from "./pages/TreeDemo";
import treeDemoTemplate from "./pages/TreeDemo.tml";
import { AjaxFormLoopDemo } from "./pages/AjaxFormLoopDemo";
import ajaxFormLoopDemoTemplate from "./pages/AjaxFormLoopDemo.tml";
import { SubmitNotifierDemo } from "./pages/SubmitNotifierDemo";
import submitNotifierDemoTemplate from "./pages/SubmitNotifierDemo.tml";
import { SubmitNotifierResult } from "./pages/SubmitNotifierResult";
import submitNotifierResultTemplate from "./pages/SubmitNotifierResult.tml";
import { TriggerDemo } from "./pages/TriggerDemo";
import triggerDemoTemplate from "./pages/TriggerDemo.tml";
import { ChecklistDemo } from "./pages/ChecklistDemo";
import checklistDemoTemplate from "./pages/ChecklistDemo.tml";
import { ChecklistResult } from "./pages/ChecklistResult";
import checklistResultTemplate from "./pages/ChecklistResult.tml";
import { ErrorDemo } from "./pages/ErrorDemo";
import errorDemoTemplate from "./pages/ErrorDemo.tml";
import { FontAwesomeIconDemo } from "./pages/FontAwesomeIconDemo";
import fontAwesomeIconDemoTemplate from "./pages/FontAwesomeIconDemo.tml";
import { PropertyDisplayDemo } from "./pages/PropertyDisplayDemo";
import propertyDisplayDemoTemplate from "./pages/PropertyDisplayDemo.tml";
import { AlertsDemo } from "./pages/AlertsDemo";
import alertsDemoTemplate from "./pages/AlertsDemo.tml";
import { AlertsSourceDemo } from "./pages/AlertsSourceDemo";
import alertsSourceDemoTemplate from "./pages/AlertsSourceDemo.tml";
import { AlertsDynamicDemo } from "./pages/AlertsDynamicDemo";
import alertsDynamicDemoTemplate from "./pages/AlertsDynamicDemo.tml";
import { DynamicDemo } from "./pages/DynamicDemo";
import dynamicDemoTemplate from "./pages/DynamicDemo.tml";
import { DevToolDemo } from "./pages/DevToolDemo";
import devToolDemoTemplate from "./pages/DevToolDemo.tml";
import { ImportDemo } from "./pages/ImportDemo";
import importDemoTemplate from "./pages/ImportDemo.tml";
import { ValidationDemo } from "./pages/ValidationDemo";
import validationDemoTemplate from "./pages/ValidationDemo.tml";
import { ClickShiftDemo } from "./pages/ClickShiftDemo";
import clickShiftDemoTemplate from "./pages/ClickShiftDemo.tml";
import { Marker } from "./components/Marker";
import { InjectComponentDemo } from "./pages/InjectComponentDemo";
import injectComponentDemoTemplate from "./pages/InjectComponentDemo.tml";
import { InjectPageDemo } from "./pages/InjectPageDemo";
import injectPageDemoTemplate from "./pages/InjectPageDemo.tml";
import { InjectPageTarget } from "./pages/InjectPageTarget";
import injectPageTargetTemplate from "./pages/InjectPageTarget.tml";
import { PageActivationContextDemo } from "./pages/PageActivationContextDemo";
import pageActivationContextDemoTemplate from "./pages/PageActivationContextDemo.tml";
import { RedirectStart } from "./pages/RedirectStart";
import redirectStartTemplate from "./pages/RedirectStart.tml";
import { Redirector } from "./pages/Redirector";
import redirectorTemplate from "./pages/Redirector.tml";
import { RedirectTarget } from "./pages/RedirectTarget";
import redirectTargetTemplate from "./pages/RedirectTarget.tml";
import { PassivateObjectDemo } from "./pages/PassivateObjectDemo";
import passivateObjectDemoTemplate from "./pages/PassivateObjectDemo.tml";
import { NeedsParam } from "./components/NeedsParam";
import { RequiredParamDemo } from "./pages/RequiredParamDemo";
import requiredParamDemoTemplate from "./pages/RequiredParamDemo.tml";
import { AllowNullParam } from "./components/AllowNullParam";
import { PrefixThing } from "./components/PrefixThing";
import { PrefixDemo } from "./pages/PrefixDemo";
import prefixDemoTemplate from "./pages/PrefixDemo.tml";
import { DefaultValueThing } from "./components/DefaultValueThing";
import { DefaultValueDemo } from "./pages/DefaultValueDemo";
import defaultValueDemoTemplate from "./pages/DefaultValueDemo.tml";
import { LocaleDemo } from "./pages/LocaleDemo";
import localeDemoTemplate from "./pages/LocaleDemo.tml";
import { MessagesApiDemo } from "./pages/MessagesApiDemo";
import messagesApiDemoTemplate from "./pages/MessagesApiDemo.tml";
import { AllowNullNullDemo } from "./pages/AllowNullNullDemo";
import allowNullNullDemoTemplate from "./pages/AllowNullNullDemo.tml";
import { AllowNullOkDemo } from "./pages/AllowNullOkDemo";
import allowNullOkDemoTemplate from "./pages/AllowNullOkDemo.tml";
import { UnknownValidatorDemo } from "./pages/UnknownValidatorDemo";
import unknownValidatorDemoTemplate from "./pages/UnknownValidatorDemo.tml";
import { ElementInformalDemo } from "./pages/ElementInformalDemo";
import elementInformalDemoTemplate from "./pages/ElementInformalDemo.tml";
import { PhaseRec } from "./components/PhaseRec";
import { PhaseOrderDemo } from "./pages/PhaseOrderDemo";
import phaseOrderDemoTemplate from "./pages/PhaseOrderDemo.tml";
import { CleanupProbe } from "./components/CleanupProbe";
import { RenderableProvider } from "./components/RenderableProvider";
import { RenderableUser } from "./components/RenderableUser";
import { EnvStamp } from "./components/EnvStamp";
import { MarkOne } from "./components/MarkOne";
import { MarkTwo } from "./components/MarkTwo";
import { AutoMarked } from "./components/AutoMarked";
import { MergedThing } from "./components/MergedThing";
import { OrderedThing } from "./components/OrderedThing";
import { DupThing } from "./components/DupThing";
import { ConditionalBody } from "./components/ConditionalBody";
import { ForceBody } from "./components/ForceBody";
import { CountBegin } from "./components/CountBegin";
import { RepeatOnce } from "./components/RepeatOnce";
import { CleanupDemo } from "./pages/CleanupDemo";
import cleanupDemoTemplate from "./pages/CleanupDemo.tml";
import { ReporterDemo } from "./pages/ReporterDemo";
import reporterDemoTemplate from "./pages/ReporterDemo.tml";
import { KeyedListDemo } from "./pages/KeyedListDemo";
import keyedListDemoTemplate from "./pages/KeyedListDemo.tml";
import { FormInZoneDemo } from "./pages/FormInZoneDemo";
import formInZoneDemoTemplate from "./pages/FormInZoneDemo.tml";
import { ZonePruneDemo } from "./pages/ZonePruneDemo";
import zonePruneDemoTemplate from "./pages/ZonePruneDemo.tml";
import { ZonePruneTarget } from "./pages/ZonePruneTarget";
import zonePruneTargetTemplate from "./pages/ZonePruneTarget.tml";
// --- Hardening pass: additional edge/chaos demo pages ---
import { CheckboxCheckedDemo } from "./pages/CheckboxCheckedDemo";
import checkboxCheckedDemoTemplate from "./pages/CheckboxCheckedDemo.tml";
import { SelectModelDemo } from "./pages/SelectModelDemo";
import selectModelDemoTemplate from "./pages/SelectModelDemo.tml";
import { ChecklistStateDemo } from "./pages/ChecklistStateDemo";
import checklistStateDemoTemplate from "./pages/ChecklistStateDemo.tml";
import { ChecklistEmptyDemo } from "./pages/ChecklistEmptyDemo";
import checklistEmptyDemoTemplate from "./pages/ChecklistEmptyDemo.tml";
import { DateFieldEmptyDemo } from "./pages/DateFieldEmptyDemo";
import dateFieldEmptyDemoTemplate from "./pages/DateFieldEmptyDemo.tml";
import { LoopEdgeDemo } from "./pages/LoopEdgeDemo";
import loopEdgeDemoTemplate from "./pages/LoopEdgeDemo.tml";
import { LoopElementEmptyDemo } from "./pages/LoopElementEmptyDemo";
import loopElementEmptyDemoTemplate from "./pages/LoopElementEmptyDemo.tml";
import { LinkSubmitValidateDemo } from "./pages/LinkSubmitValidateDemo";
import linkSubmitValidateDemoTemplate from "./pages/LinkSubmitValidateDemo.tml";
import { TextFieldValidateDemo } from "./pages/TextFieldValidateDemo";
import textFieldValidateDemoTemplate from "./pages/TextFieldValidateDemo.tml";
import { TextAreaValidateDemo } from "./pages/TextAreaValidateDemo";
import textAreaValidateDemoTemplate from "./pages/TextAreaValidateDemo.tml";
import { PasswordFieldValidateDemo } from "./pages/PasswordFieldValidateDemo";
import passwordFieldValidateDemoTemplate from "./pages/PasswordFieldValidateDemo.tml";
import { HiddenEdgeDemo } from "./pages/HiddenEdgeDemo";
import hiddenEdgeDemoTemplate from "./pages/HiddenEdgeDemo.tml";
import { OutputCasesDemo } from "./pages/OutputCasesDemo";
import outputCasesDemoTemplate from "./pages/OutputCasesDemo.tml";
import { OutputRawCasesDemo } from "./pages/OutputRawCasesDemo";
import outputRawCasesDemoTemplate from "./pages/OutputRawCasesDemo.tml";
import { TextOutputCasesDemo } from "./pages/TextOutputCasesDemo";
import textOutputCasesDemoTemplate from "./pages/TextOutputCasesDemo.tml";
import { PropertyDisplayCasesDemo } from "./pages/PropertyDisplayCasesDemo";
import propertyDisplayCasesDemoTemplate from "./pages/PropertyDisplayCasesDemo.tml";
import { BeanDisplayCasesDemo } from "./pages/BeanDisplayCasesDemo";
import beanDisplayCasesDemoTemplate from "./pages/BeanDisplayCasesDemo.tml";
import { FormFragmentHiddenDemo } from "./pages/FormFragmentHiddenDemo";
import formFragmentHiddenDemoTemplate from "./pages/FormFragmentHiddenDemo.tml";
import { PaletteResult } from "./pages/PaletteResult";
import paletteResultTemplate from "./pages/PaletteResult.tml";
import { PaletteFullDemo } from "./pages/PaletteFullDemo";
import paletteFullDemoTemplate from "./pages/PaletteFullDemo.tml";
import { PaletteReorderDemo } from "./pages/PaletteReorderDemo";
import paletteReorderDemoTemplate from "./pages/PaletteReorderDemo.tml";
import { TreeNestedDemo } from "./pages/TreeNestedDemo";
import treeNestedDemoTemplate from "./pages/TreeNestedDemo.tml";
import { TreeEmptyDemo } from "./pages/TreeEmptyDemo";
import treeEmptyDemoTemplate from "./pages/TreeEmptyDemo.tml";
import { GridEmptyDemo } from "./pages/GridEmptyDemo";
import gridEmptyDemoTemplate from "./pages/GridEmptyDemo.tml";
import { GridSinglePageDemo } from "./pages/GridSinglePageDemo";
import gridSinglePageDemoTemplate from "./pages/GridSinglePageDemo.tml";
import { KaptchaVerifyDemo } from "./pages/KaptchaVerifyDemo";
import kaptchaVerifyDemoTemplate from "./pages/KaptchaVerifyDemo.tml";
import { KaptchaResult } from "./pages/KaptchaResult";
import kaptchaResultTemplate from "./pages/KaptchaResult.tml";
import { ZoneErrorDemo } from "./pages/ZoneErrorDemo";
import zoneErrorDemoTemplate from "./pages/ZoneErrorDemo.tml";

registerBuiltins();
// Message catalogues consolidated from the app's *.properties files (build time).
Messages.registerCatalogues(messageCatalogues);
// Test hook: expose the live zone-registry size so a spec can assert pruning.
(window as unknown as { __zoneCount: () => number }).__zoneCount = () => Zones.size();
Registry.registerComponent("marker", Marker);
Registry.registerComponent("needsparam", NeedsParam);
Registry.registerComponent("allownullparam", AllowNullParam);
Registry.registerComponent("prefixthing", PrefixThing);
Registry.registerComponent("defaultvaluething", DefaultValueThing);
Registry.registerComponent("phaserec", PhaseRec);
Registry.registerComponent("cleanupprobe", CleanupProbe);
Registry.registerComponent("renderableprovider", RenderableProvider);
Registry.registerComponent("renderableuser", RenderableUser);
Registry.registerComponent("envstamp", EnvStamp);
Registry.registerComponent("markone", MarkOne);
Registry.registerComponent("marktwo", MarkTwo);
Registry.registerComponent("automarked", AutoMarked);
Registry.registerComponent("mergedthing", MergedThing);
Registry.registerComponent("orderedthing", OrderedThing);
Registry.registerComponent("dupthing", DupThing);
Registry.registerComponent("conditionalbody", ConditionalBody);
Registry.registerComponent("forcebody", ForceBody);
Registry.registerComponent("countbegin", CountBegin);
Registry.registerComponent("repeatonce", RepeatOnce);

const app = document.querySelector("#app");
if (!app) throw new Error("missing #app mount point");

new Router({
  routes: [
    { name: "index", page: Index, template: indexTemplate },
    { name: "loop-empty", page: LoopEmpty, template: loopEmptyTemplate },
    { name: "loop-null", page: LoopNull, template: loopNullTemplate },
    { name: "loop-generic", page: LoopGeneric, template: loopGenericTemplate },
    { name: "loop-form", page: LoopFormDemo, template: loopFormDemoTemplate },
    { name: "ajaxloop-submit", page: AjaxLoopSubmitDemo, template: ajaxLoopSubmitDemoTemplate },
    { name: "nested-loop-form", page: NestedLoopFormDemo, template: nestedLoopFormDemoTemplate },
    { name: "confirm-mixin", page: ConfirmMixinDemo, template: confirmMixinDemoTemplate },
    { name: "confirm-result", page: ConfirmResult, template: confirmResultTemplate },
    { name: "discardbody", page: DiscardBodyDemo, template: discardBodyDemoTemplate },
    { name: "render-disabled", page: RenderDisabledDemo, template: renderDisabledDemoTemplate },
    { name: "bind-parameter", page: BindParameterDemo, template: bindParameterDemoTemplate },
    { name: "environmental", page: EnvironmentalDemo, template: environmentalDemoTemplate },
    { name: "zone-refresh", page: ZoneRefreshDemo, template: zoneRefreshDemoTemplate },
    { name: "trigger-fragment", page: TriggerFragmentDemo, template: triggerFragmentDemoTemplate },
    { name: "autocomplete", page: AutocompleteDemo, template: autocompleteDemoTemplate },
    { name: "class-mixin", page: ClassMixinDemo, template: classMixinDemoTemplate },
    { name: "dup-mixin", page: DupMixinDemo, template: dupMixinDemoTemplate },
    { name: "return-protocol", page: ReturnProtocolDemo, template: returnProtocolDemoTemplate },
    { name: "life-a", page: LifePageA, template: lifePageATemplate },
    { name: "life-b", page: LifePageB, template: lifePageBTemplate },
    { name: "life-conv", page: LifeConvention, template: lifeConventionTemplate },
    { name: "life-redirect", page: LifeRedirect, template: lifeRedirectTemplate },
    { name: "life-timer", page: LifeTimer, template: lifeTimerTemplate },
    { name: "if-unless", page: IfUnless, template: ifUnlessTemplate },
    { name: "zone", page: ZoneDemo, template: zoneDemoTemplate },
    { name: "checkbox", page: CheckboxDemo, template: checkboxDemoTemplate },
    { name: "checkbox-result", page: CheckboxResult, template: checkboxResultTemplate },
    { name: "pagelink-source", page: PageLinkSource, template: pageLinkSourceTemplate },
    { name: "pagelink-target", page: PageLinkTarget, template: pageLinkTargetTemplate },
    { name: "textfield", page: TextFieldDemo, template: textFieldDemoTemplate },
    { name: "textfield-result", page: TextFieldResult, template: textFieldResultTemplate },
    { name: "select", page: SelectDemo, template: selectDemoTemplate },
    { name: "select-result", page: SelectResult, template: selectResultTemplate },
    { name: "select-blank", page: SelectBlankDemo, template: selectBlankDemoTemplate },
    { name: "radio", page: RadioDemo, template: radioDemoTemplate },
    { name: "radio-result", page: RadioResult, template: radioResultTemplate },
    { name: "datefield", page: DateFieldDemo, template: dateFieldDemoTemplate },
    { name: "datefield-result", page: DateFieldResult, template: dateFieldResultTemplate },
    { name: "passwordfield", page: PasswordFieldDemo, template: passwordFieldDemoTemplate },
    { name: "passwordfield-result", page: PasswordFieldResult, template: passwordFieldResultTemplate },
    { name: "submit", page: SubmitDemo, template: submitDemoTemplate },
    { name: "submit-result", page: SubmitResult, template: submitResultTemplate },
    { name: "submit-mode", page: SubmitModeDemo, template: submitModeDemoTemplate },
    { name: "label", page: LabelDemo, template: labelDemoTemplate },
    { name: "errors", page: ErrorsDemo, template: errorsDemoTemplate },
    { name: "grid", page: GridDemo, template: gridDemoTemplate },
    { name: "beandisplay", page: BeanDisplayDemo, template: beanDisplayDemoTemplate },
    { name: "kaptcha", page: KaptchaDemo, template: kaptchaDemoTemplate },
    { name: "textarea", page: TextAreaDemo, template: textAreaDemoTemplate },
    { name: "textarea-result", page: TextAreaResult, template: textAreaResultTemplate },
    { name: "hidden", page: HiddenDemo, template: hiddenDemoTemplate },
    { name: "hidden-result", page: HiddenResult, template: hiddenResultTemplate },
    { name: "any", page: AnyDemo, template: anyDemoTemplate },
    { name: "output", page: OutputDemo, template: outputDemoTemplate },
    { name: "outputraw", page: OutputRawDemo, template: outputRawDemoTemplate },
    { name: "textoutput", page: TextOutputDemo, template: textOutputDemoTemplate },
    { name: "palette", page: PaletteDemo, template: paletteDemoTemplate },
    { name: "beaneditor", page: BeanEditorDemo, template: beanEditorDemoTemplate },
    { name: "propertyeditor", page: PropertyEditorDemo, template: propertyEditorDemoTemplate },
    { name: "formfragment", page: FormFragmentDemo, template: formFragmentDemoTemplate },
    { name: "progressivedisplay", page: ProgressiveDisplayDemo, template: progressiveDisplayDemoTemplate },
    { name: "linksubmit", page: LinkSubmitDemo, template: linkSubmitDemoTemplate },
    { name: "double-submit", page: DoubleSubmitDemo, template: doubleSubmitDemoTemplate },
    { name: "linksubmit-result", page: LinkSubmitResult, template: linkSubmitResultTemplate },
    { name: "tree", page: TreeDemo, template: treeDemoTemplate },
    { name: "ajaxformloop", page: AjaxFormLoopDemo, template: ajaxFormLoopDemoTemplate },
    { name: "submitnotifier", page: SubmitNotifierDemo, template: submitNotifierDemoTemplate },
    { name: "submitnotifier-result", page: SubmitNotifierResult, template: submitNotifierResultTemplate },
    { name: "trigger", page: TriggerDemo, template: triggerDemoTemplate },
    { name: "checklist", page: ChecklistDemo, template: checklistDemoTemplate },
    { name: "checklist-result", page: ChecklistResult, template: checklistResultTemplate },
    { name: "error", page: ErrorDemo, template: errorDemoTemplate },
    { name: "fontawesomeicon", page: FontAwesomeIconDemo, template: fontAwesomeIconDemoTemplate },
    { name: "propertydisplay", page: PropertyDisplayDemo, template: propertyDisplayDemoTemplate },
    { name: "alerts", page: AlertsDemo, template: alertsDemoTemplate },
    { name: "alerts-source", page: AlertsSourceDemo, template: alertsSourceDemoTemplate },
    { name: "alerts-dynamic", page: AlertsDynamicDemo, template: alertsDynamicDemoTemplate },
    { name: "dynamic", page: DynamicDemo, template: dynamicDemoTemplate },
    { name: "devtool", page: DevToolDemo, template: devToolDemoTemplate },
    { name: "import", page: ImportDemo, template: importDemoTemplate },
    { name: "validation", page: ValidationDemo, template: validationDemoTemplate },
    { name: "click-shift", page: ClickShiftDemo, template: clickShiftDemoTemplate },
    { name: "injectcomponent", page: InjectComponentDemo, template: injectComponentDemoTemplate },
    { name: "injectpage", page: InjectPageDemo, template: injectPageDemoTemplate },
    { name: "injectpage-target", page: InjectPageTarget, template: injectPageTargetTemplate },
    { name: "pactx", page: PageActivationContextDemo, template: pageActivationContextDemoTemplate },
    { name: "redirect-start", page: RedirectStart, template: redirectStartTemplate },
    { name: "redirector", page: Redirector, template: redirectorTemplate },
    { name: "redirect-target", page: RedirectTarget, template: redirectTargetTemplate },
    { name: "passivate-object", page: PassivateObjectDemo, template: passivateObjectDemoTemplate },
    { name: "required-param", page: RequiredParamDemo, template: requiredParamDemoTemplate },
    { name: "allownull-null", page: AllowNullNullDemo, template: allowNullNullDemoTemplate },
    { name: "allownull-ok", page: AllowNullOkDemo, template: allowNullOkDemoTemplate },
    { name: "prefix", page: PrefixDemo, template: prefixDemoTemplate },
    { name: "default-value", page: DefaultValueDemo, template: defaultValueDemoTemplate },
    { name: "locale", page: LocaleDemo, template: localeDemoTemplate },
    { name: "messages-api", page: MessagesApiDemo, template: messagesApiDemoTemplate },
    { name: "unknown-validator", page: UnknownValidatorDemo, template: unknownValidatorDemoTemplate },
    { name: "element-informal", page: ElementInformalDemo, template: elementInformalDemoTemplate },
    { name: "phase-order", page: PhaseOrderDemo, template: phaseOrderDemoTemplate },
    { name: "cleanup-demo", page: CleanupDemo, template: cleanupDemoTemplate },
    { name: "reporter-demo", page: ReporterDemo, template: reporterDemoTemplate },
    { name: "keyed-list", page: KeyedListDemo, template: keyedListDemoTemplate },
    { name: "form-in-zone", page: FormInZoneDemo, template: formInZoneDemoTemplate },
    { name: "zone-prune", page: ZonePruneDemo, template: zonePruneDemoTemplate },
    { name: "zone-prune-target", page: ZonePruneTarget, template: zonePruneTargetTemplate },
    // --- Hardening pass: additional edge/chaos demo routes ---
    { name: "checkbox-checked", page: CheckboxCheckedDemo, template: checkboxCheckedDemoTemplate },
    { name: "select-model", page: SelectModelDemo, template: selectModelDemoTemplate },
    { name: "checklist-state", page: ChecklistStateDemo, template: checklistStateDemoTemplate },
    { name: "checklist-empty", page: ChecklistEmptyDemo, template: checklistEmptyDemoTemplate },
    { name: "datefield-empty", page: DateFieldEmptyDemo, template: dateFieldEmptyDemoTemplate },
    { name: "loop-edge", page: LoopEdgeDemo, template: loopEdgeDemoTemplate },
    { name: "loop-element-empty", page: LoopElementEmptyDemo, template: loopElementEmptyDemoTemplate },
    { name: "linksubmit-validate", page: LinkSubmitValidateDemo, template: linkSubmitValidateDemoTemplate },
    { name: "textfield-validate", page: TextFieldValidateDemo, template: textFieldValidateDemoTemplate },
    { name: "textarea-validate", page: TextAreaValidateDemo, template: textAreaValidateDemoTemplate },
    { name: "passwordfield-validate", page: PasswordFieldValidateDemo, template: passwordFieldValidateDemoTemplate },
    { name: "hidden-edge", page: HiddenEdgeDemo, template: hiddenEdgeDemoTemplate },
    { name: "output-cases", page: OutputCasesDemo, template: outputCasesDemoTemplate },
    { name: "outputraw-cases", page: OutputRawCasesDemo, template: outputRawCasesDemoTemplate },
    { name: "textoutput-cases", page: TextOutputCasesDemo, template: textOutputCasesDemoTemplate },
    { name: "propertydisplay-cases", page: PropertyDisplayCasesDemo, template: propertyDisplayCasesDemoTemplate },
    { name: "beandisplay-cases", page: BeanDisplayCasesDemo, template: beanDisplayCasesDemoTemplate },
    { name: "formfragment-hidden", page: FormFragmentHiddenDemo, template: formFragmentHiddenDemoTemplate },
    { name: "palette-result", page: PaletteResult, template: paletteResultTemplate },
    { name: "palette-full", page: PaletteFullDemo, template: paletteFullDemoTemplate },
    { name: "palette-reorder", page: PaletteReorderDemo, template: paletteReorderDemoTemplate },
    { name: "tree-nested", page: TreeNestedDemo, template: treeNestedDemoTemplate },
    { name: "tree-empty", page: TreeEmptyDemo, template: treeEmptyDemoTemplate },
    { name: "grid-empty", page: GridEmptyDemo, template: gridEmptyDemoTemplate },
    { name: "grid-single", page: GridSinglePageDemo, template: gridSinglePageDemoTemplate },
    { name: "kaptcha-verify", page: KaptchaVerifyDemo, template: kaptchaVerifyDemoTemplate },
    { name: "kaptcha-result", page: KaptchaResult, template: kaptchaResultTemplate },
    { name: "zone-error", page: ZoneErrorDemo, template: zoneErrorDemoTemplate },
    // component test pages are appended here by later tasks
  ],
  mount: app,
  indexRoute: "index",
}).start();
