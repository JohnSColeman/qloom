# Qloom — Component Test Parity Ledger

Tracks every tapestry-5 integration test case ported into `@qloom/component-tests`.
Source suites link to `apache/tapestry-5@master`. Status: `ported` (live, passing),
`red-pending` (failing spec driving an unbuilt component or a recorded gap),
`skip:<reason>` (committed as `test.skip`/`test.fixme`), `out-of-scope:<reason>`
(framework mechanics not tied to a single component; recorded, not ported).

Skipped and pending cases are rolled up by theme in [BACKLOG.md](BACKLOG.md) §7.

**Test lanes** (red-pending specs are tagged `@red-pending`):
- `pnpm --filter @qloom/component-tests test` — green lane (excludes `@red-pending`); the CI gate, stays fast and passes.
- `pnpm --filter @qloom/component-tests test:pending` — the backlog TDD drivers; expected to fail until each component is built.
- `pnpm --filter @qloom/component-tests test:all` — everything.

| tapestry suite | tapestry case | Qloom spec | Qloom test | status |
|---|---|---|---|---|
| [LoopTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/LoopTests.java) | generic_loop | Loop.spec.ts | generic loop renders each item by index | ported |
| LoopTests | handling_of_empty_loop (empty list) | Loop.spec.ts | empty-list source renders nothing | ported |
| LoopTests | handling_of_empty_loop (null source) | Loop.spec.ts | null source renders nothing | ported |
| LoopTests | encoded_loop_inside_a_form | LoopForm.spec.ts | loop inside a form round-trips edited values | ported (Qloom replays over the live in-memory source — no ValueEncoder/formdata needed) |
| LoopTests | volatile_loop_inside_a_form | LoopForm.spec.ts | loop inside a form round-trips edited values | ported |
| LoopTests | after_render_does_not_shortcut_other_after_render_phase_methods | Loop.spec.ts | afterRender does not shortcut sibling mixin afterRender phases | skip: mixin out of scope |
| [CoreBehaviorsTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/CoreBehaviorsTests.java) | If then-body | If.spec.ts | renders then-body when test is true | ported |
| CoreBehaviorsTests | If else-block | If.spec.ts | renders else block when test is false | ported |
| [GeneralComponentTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/GeneralComponentTests.java) | unless_component | Unless.spec.ts | renders body when test is false; renders nothing when true | ported |
| CoreBehaviorsTests | Delegate/block | Delegate.spec.ts | delegates rendering to a bound block | skip: dedicated demo deferred to Delegate follow-on |
| [ZoneTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/ZoneTests.java) | zone_updates | Zone.spec.ts | EventLink updates the bound zone client-side | ported |
| ZoneTests | update_zone_with_empty_body | Zone.spec.ts | zone updates from empty to a message | ported |
| ZoneTests | select_zone | Zone.spec.ts | cascading select updates a dependent zone | skip: needs Form family |
| ZoneTests | zone_redirect_by_class | Zone.spec.ts | zone event can redirect to another page | skip: SSR redirect |
| ZoneTests | update_multiple_zones_at_once | Zone.spec.ts | updates multiple zones at once | skip: MultiZoneUpdate server API |
| ZoneTests | multi_zone_update_using_string_in_loop | Zone.spec.ts | multi-zone update using string in a loop | skip: MultiZoneUpdate server API |
| ZoneTests | zone_namespace_interaction_fixed | Zone.spec.ts | zone namespace interaction | skip: JS namespace/asset concern |
| ZoneTests | zone_updated_event_triggered_on_client | Zone.spec.ts | zone:updated event triggered on client | skip: client zone event not modelled |
| ZoneTests | link_submit_inside_form_that_updates_a_zone | Zone.spec.ts | LinkSubmit inside a form updates a zone | skip: needs LinkSubmit (backlog) |
| ZoneTests | zone_inject_component_from_template | Zone.spec.ts | zone injects a component from the template | skip: @InjectComponent server wiring |
| ZoneTests | update_zone_inside_form | Zone.spec.ts | update a zone inside a form | skip: needs Form family |
| ZoneTests | update_to_zone_inside_form | Zone.spec.ts | update to a zone inside a form | skip: needs Form family |
| ZoneTests | css_insertion_point | Zone.spec.ts | css insertion point | skip: asset/CSS framework concern |
| ZoneTests | update_zone_with_no_clientid | Zone.spec.ts | update a zone with no client id via AjaxResponseRenderer | skip: AjaxResponseRenderer server API |
| [FormTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/FormTests.java) | (Checkbox renders) | Checkbox.spec.ts | renders an input[type=checkbox] | ported |
| FormTests | validate_checkbox_must_be_checked | Checkbox.spec.ts | two-way binds the boolean on submit (checked → true) | ported |
| FormTests | validate_checkbox_must_be_unchecked | Checkbox.spec.ts | two-way binds the boolean on submit (unchecked → false) | ported |
| [CoreBehaviorsTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/CoreBehaviorsTests.java) | (PageLink renders href) | PageLink.spec.ts | renders a routable href including its context | ported |
| CoreBehaviorsTests | page_link_with_explicit_activation_context | PageLink.spec.ts | navigates with an explicit activation context | ported |
| CoreBehaviorsTests | page_link_with_explicit_empty_context | PageLink.spec.ts | navigates with no activation context | ported |
| FormTests | (TextField renders) | TextField.spec.ts | renders an input[type=text] | ported |
| FormTests | server_side_validation_for_textfield_and_textarea (required) | TextField.spec.ts | required validation blocks submit and reports the field | ported |
| FormTests | server_side_validation_for_textfield_and_textarea (two-way bind) | TextField.spec.ts | valid submit two-way binds the value (PRG) | ported |
| FormTests / [SelectTest](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/corelib/components/SelectTest.java) | (Select renders model options) | Select.spec.ts | renders the model options | ported |
| FormTests / SelectTest | (Select bound value selected) | Select.spec.ts | renders with the bound value selected | ported |
| FormTests / SelectTest | (Select two-way binds on submit) | Select.spec.ts | two-way binds the chosen value on submit | ported |
| FormTests | (radios share RadioGroup name) | Radio.spec.ts | radios share the RadioGroup name | ported |
| FormTests | (bound radio checked) | Radio.spec.ts | the bound value's radio is checked | ported |
| FormTests | (RadioGroup two-way binds on submit) | Radio.spec.ts | two-way binds the selected value on submit | ported |
| FormTests | (DateField renders date input) | DateField.spec.ts | renders a native date input with the bound value | ported |
| FormTests | (DateField two-way binds on submit) | DateField.spec.ts | two-way binds the value on submit | ported |
| FormTests | (PasswordField renders password input) | PasswordField.spec.ts | renders an input[type=password] | ported |
| FormTests | (PasswordField two-way binds on submit) | PasswordField.spec.ts | two-way binds the value on submit | ported |
| [SubmitTest](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/corelib/components/SubmitTest.java) | (Submit renders input) | Submit.spec.ts | renders an input[type=submit] with its value | ported |
| SubmitTest | test_submit_event_fired | Submit.spec.ts | clicking Submit submits the enclosing form (PRG) | ported |
| FormTests | (Label renders for + body) | Label.spec.ts | renders a label with a for attribute and its body | ported |
| FormTests | (Label humanizes empty body) | Label.spec.ts | renders the humanized field id when the body is empty | ported |
| FormTests | (Errors empty before submit) | Errors.spec.ts | shows no errors before submission | ported |
| FormTests | (Errors lists field errors) | Errors.spec.ts | lists every field error after an invalid submit | ported |
| [GridTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/GridTests.java) | (headers, rows, cell override) | Grid.spec.ts | renders headers, a page of rows, and the priceCell override | ported |
| GridTests | (pager pagination) | Grid.spec.ts | the pager switches pages and re-renders the table in place | ported |
| [BeanEditorTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/BeanEditorTests.java) | nested_bean_editor_and_bean_display (dt labels) | BeanDisplay.spec.ts | renders humanized property labels as dt elements | ported |
| BeanEditorTests | nested_bean_editor_and_bean_display (dd values) | BeanDisplay.spec.ts | renders property values as dd elements in include order | ported |
| [KaptchaIntegrationTest](https://github.com/apache/tapestry-5/blob/master/tapestry-kaptcha/src/test/java/org/apache/tapestry5/kaptcha/integration/KaptchaIntegrationTest.java) | (KaptchaImage renders img) | Kaptcha.spec.ts | KaptchaImage renders a challenge image | ported |
| KaptchaIntegrationTest | (KaptchaField renders input) | Kaptcha.spec.ts | KaptchaField renders a text input | ported |
| KaptchaIntegrationTest | (challenge verification flow) | Kaptcha.spec.ts | verifies the entered challenge value against the image | skip: needs captchaProvider wired |
| FormTests | (TextArea renders) | TextArea.spec.ts | renders a textarea | ported |
| FormTests | server_side_validation_for_textfield_and_textarea (TextArea bind) | TextArea.spec.ts | two-way binds the value on submit | ported |
| [HiddenTest](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/corelib/components/HiddenTest.java) | (Hidden renders hidden input) | Hidden.spec.ts | renders an input[type=hidden] with the property value | ported |
| HiddenTest | (Hidden round-trips value) | Hidden.spec.ts | round-trips its value through submit | ported |
| [AnyTest](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/corelib/components/AnyTest.java) | (Any renders element) | Any.spec.ts | renders the element named by the element parameter | ported |
| AnyTest | (Any passes informals) | Any.spec.ts | passes informal parameters through to the element | ported |
| [OutputTest](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/corelib/components/OutputTest.java) | (Output writes formatted value) | Output.spec.ts | writes its formatted value | ported |
| [OutputRawTest](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/corelib/components/OutputRawTest.java) | (OutputRaw writes unescaped markup) | OutputRaw.spec.ts | writes unescaped markup | ported |
| [TextOutputTest](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/corelib/components/TextOutputTest.java) | (TextOutput one p per line) | TextOutput.spec.ts | splits text into one paragraph per line | ported |
| [PaletteTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/PaletteTests.java) | palette_component (two list boxes) | Palette.spec.ts | renders available and selected list boxes | ported |
| PaletteTests | palette_component (available options) | Palette.spec.ts | the available list holds the model options | ported |
| BeanEditorTests | (BeanEditForm generates fields) | BeanEditor.spec.ts | generates an input per bean property | ported |
| BeanEditorTests | (BeanEditForm submit control) | BeanEditor.spec.ts | renders a submit control | ported |
| [PropertyEditorTest](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/corelib/components/PropertyEditorTest.java) | (renders single-property field) | PropertyEditor.spec.ts | renders an editor field for the single property | ported |
| PropertyEditorTest | (seeds current value) | PropertyEditor.spec.ts | seeds the field with the current property value | ported |
| [AjaxTests](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/java/org/apache/tapestry5/integration/app1/AjaxTests.java) | form_fragment | FormFragment.spec.ts | renders its content when visible | ported |
| AjaxTests | progressive_display | ProgressiveDisplay.spec.ts | reveals the real content after the deferred update | ported |
| FormTests / ZoneTests | link_submit_inside_form_that_updates_a_zone (renders link) | LinkSubmit.spec.ts | renders a submit hyperlink | ported |
| FormTests / ZoneTests | link_submit_inside_form_that_updates_a_zone (submits form) | LinkSubmit.spec.ts | clicking the link submits the enclosing form | ported |
| [TreeTests.groovy](https://github.com/apache/tapestry-5/blob/master/tapestry-core/src/test/groovy/org/apache/tapestry5/integration/app1/TreeTests.groovy) | basics (root label) | Tree.spec.ts | renders the tree root label | ported |
| TreeTests.groovy | basics (expand children) | Tree.spec.ts | reveals child nodes when a node is expanded | ported |
| AjaxTests | ajax_form_loop (renders rows) | AjaxFormLoop.spec.ts | renders a row per source item | ported |
| AjaxTests | ajax_form_loop (AddRowLink) | AjaxFormLoop.spec.ts | AddRowLink adds a new row | ported |
| AjaxTests | remove_ajaxformloop_values_using_buttons | AjaxFormLoop.spec.ts | RemoveRowLink removes a row | ported |
| FormTests | (Checklist renders checkboxes) | Checklist.spec.ts | renders a checkbox per model option | ported |
| FormTests | (Checklist labels options) | Checklist.spec.ts | labels each checkbox with its option | ported |
| FormTests | (Error single-field presenter) | Error.spec.ts | presents the field's validation error after an invalid submit | ported |
| (component reference) | FontAwesomeIcon renders fa <i> | FontAwesomeIcon.spec.ts | renders an <i> with the FontAwesome class | ported |
| BeanEditorTests | (PropertyDisplay single value) | PropertyDisplay.spec.ts | outputs the single property value | ported |
| (component reference) | Alerts renders container | Alerts.spec.ts | renders the alerts container element | ported |
| (component reference) | Dynamic renders external template | Dynamic.spec.ts | renders the external template body | ported |
| (component reference) | DevTool renders dev menu | DevTool.spec.ts | renders a dev-options menu with a reload option | ported |
| (component reference) | SubmitNotifier | SubmitNotifier.spec.ts | notifies its container during form submission | ported |
| (component reference) | Trigger | Trigger.spec.ts | fires an event during rendering that can inject content | ported |
| (component reference) | Case (technique) | Case.spec.ts | emulates a case statement via Delegate + Block | skip: technique, not a component |
