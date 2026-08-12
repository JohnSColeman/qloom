# Qloom — Tapestry Component Reference coverage

The component tables from Tapestry's official [Component Reference](https://tapestry.apache.org/component-reference.html), with a third column marking whether **Qloom** implements that component (✅ implemented, ☐ not implemented, ◐ behaviour folded into another component — the capability exists, just not as a standalone component; see notes).

**Coverage:** 48 of 57 Tapestry-provided components implemented — the set the hotel-booking reference app (and the examples) actually exercise. A mixin engine is in place with `Confirm` / `DiscardBody` / `RenderDisabled` ported (the rest of the mixin catalogue, built-in pages, and base components are not — see notes). SSR-only and server-only components are out of scope by design (Qloom is browser-only; PLAN §12).

## AJAX-specific Components

| Component | Description | Qloom |
|---|---|:---:|
| AjaxFormLoop | A special form of the Loop component that adds Ajax support to handle adding new rows and removing existing rows dynamically. | ✅ |
| AddRowLink , RemoveRowLink | Used inside an AjaxFormLoop component to spur the addition or removal of a row. | ✅ |
| ProgressiveDisplay | Used to implement the progressive enhancement web design strategy; the component renders itself with a simplified initial content (i.e., "loading ...") and an Ajax request then supplies the component's true body. | ✅ |
| Zone | A region of a page marked for dynamic updating via Ajax or other client-side effects. | ✅ |

## Bean Displaying & Editing

| Component | Description | Qloom |
|---|---|:---:|
| BeanDisplay | Displays the properties of a bean, using an underlying BeanModel, as a dl element with dt/dd pairs. | ✅ |
| BeanEditForm | Creates an entire form for editing the properties of a particular bean | ✅ |
| BeanEditor | The central component of BeanEditForm, this generates a user interface for editing the properties of a bean | ✅ |
| PropertyDisplay | Outputs a single property value. Overrides for individual properties come from block parameters whose name matches the property id. This component is used by the BeanDisplay component. | ✅ |
| PropertyEditor | Used to edit a single property of a bean. This is used primarily by BeanEditForm. | ✅ |

## Conditional and Looping Components

| Component | Description | Qloom |
|---|---|:---:|
| If | Conditionally renders its body. May render its tag and any informal parameters | ✅ |
| Case | Not really a component, but a technique to emulate a "case" statement using a delegate | ☐ |
| Loop | Loops over a number of items (provided by its source parameter), rendering its body for each one] | ✅ |
| Unless | Inverse of the If component, renders its body if the condition is false. | ✅ |
| Delegate | Does not do any rendering of its own, but will delegate to some other object that can do rendering | ✅ |

## Form Components

| Component | Description | Qloom |
|---|---|:---:|
| Checkbox | Renders a standard `<input type="checkbox">` element | ✅ |
| Checklist | Renders a vertical list of `<input type="checkbox">` elements | ✅ |
| DateField | Collect a provided date from the user using a client-side JavaScript calendar | ✅ |
| Form | An HTML form, which will enclose other components to render out the various types of fields. | ✅ |
| FormFragment | A portion of a Form that may be selectively displayed | ✅ |
| Hidden | Used to record a page property as a value into the form | ✅ |
| Label | Generates a label element for a particular field | ✅ |
| KaptchaField | Part of a Captcha based authentication scheme; a KaptchaField is paired with a KaptchaImage to ensure that the user has provided the correct value | ✅ |
| KaptchaImage | Part of a Captcha based authentication scheme; a KaptchaImage generates a new text image whenever it renders and can provide the previously rendred text subsequently (it is stored persistently in the session) | ✅ |
| Palette | A multiple selection component. Generates a UI consisting of two select elements configured for multiple selection; the one on the left is the list of "available" elements, the one on the right is "selected". | ✅ |
| PasswordField | A version of TextField, but rendered out as an `<input type="password">` element. | ✅ |
| Radio | A radio button (i.e., `<input type="radio">`). Radio buttons must operate within a RadioContainer (normally, the RadioGroup component). | ✅ |
| RadioGroup | Groups together a set of radio components that all affect the same property | ✅ |
| Select | Renders a `<select>` element for selecting an item from a list of values | ✅ |
| SubmitNotifier | A non visual component used to provide notifications to its container during a form submission | ✅ |
| TextArea | Renders a `<textarea>` element for editing multi-line text | ✅ |
| TextField | Renders an `<input type="text">` element to edit single-line text | ✅ |
| Upload | A file upload component (i.e., `<input type="file">`) based on Apache Commons FileUpload | ☐ |

## Grids, Tables and Trees

| Component | Description | Qloom |
|---|---|:---:|
| Grid | Presents tabular data in a `<table>` element by iterating over a List or array | ✅ |
| GridCell | Part of Grid, renders the markup inside a single data cell | ◐ |
| GridColumns | Part of Grid, renders out the column headers for the grid, including links (where appropriate) to control column sorting | ◐ |
| GridPager | Generates a series of links used to jump to a particular page index within the overall data set | ◐ |
| GridRows | Renders out a series of rows within the table | ◐ |
| Tree | A component used to render a recursive tree structure, with expandable/collapsable/selectable nodes. | ✅ |

## Links and Buttons

| Component | Description | Qloom |
|---|---|:---:|
| ActionLink | Triggers an action on the server with a subsequent full page refresh | ✅ |
| EventLink | Like ActionLink except that the event that it triggers is explicitly controlled, rather than always "action", and the event is triggered in its container | ✅ |
| LinkSubmit | Generates a client-side hyperlink that submits the enclosing form | ✅ |
| Submit | Corresponds to `<input type="submit">` or `<input type="image">`, a client-side element that can force the enclosing form to submit | ✅ |
| PageLink | Generates a render request link to some other page in the application | ✅ |

## Output and Messages

| Component | Description | Qloom |
|---|---|:---:|
| Alerts | Renders out an empty `<div>` element and provides JavaScript initialization to make the element the container for alerts. | ✅ |
| Dynamic | Allows a component to render itself differently at different times, by making use of an external template file. | ✅ |
| Error | Presents validation errors of a single field. Must be enclosed by a Form component | ✅ |
| Errors | Standard validation error presenter. Must be enclosed by a Form component. If errors are present, renders a div element around a banner message and around an unnumbered list of error messages | ✅ |
| ExceptionDisplay | Integral part of the default ExceptionReport page used to break apart and display the properties of the exception | ☐ |
| FontAwesomeIcon | Renders an `<i>` tag with the CSS class to select a FontAwesome 4.7.0 icon. | ✅ |
| Output | A component for formatting output. If the component is represented in the template using an element, then the element (plus any informal parameters) will be output around the formatted value. | ✅ |
| OutputRaw | Output raw markup to the client. Unlike an expansion, the output from OutputRaw is unfiltered, with any special characters or entities left exactly as is. | ✅ |
| TextOutput | Outputs paragraph oriented text, typically collected via a TextArea component. The TextArea is split into lines, and each line it output inside its own p element. | ✅ |

## Miscellaneous

| Component | Description | Qloom |
|---|---|:---:|
| Any | Renders an arbitrary element including informal parameters | ✅ |
| DevTool | Renders a dropdown menu of useful options when developing, such as reloading the current page or invalidating the current HttpSession. | ✅ |
| Doctype | Overrides the DOCTYPE of the rendered document (via Document.dtd(String, String, String) which can be useful when different component templates that render to the same document disagree about what the correct DOCTYPE is. | ☐ |
| RenderObject | Renders out an object using the ObjectRenderer service. Used primarily on the ExceptionReport page | ☐ |
| Trigger | Triggers an arbitrary event during rendering. This is often useful to add JavaScript to a page or a component (via calls to the JavaScriptSupport environmental). | ✅ |

## Tapestry Mixins

The **mixin engine is in place**: `t:mixins="…"` attaches registry mixins whose
render phases interleave with the host (before-mixins → component → after-mixins, split by
`@MixinAfter`). The full injection surface is in place — `@InjectContainer`,
`@BindParameter`, and `@Environmental` — so `Confirm`, `DiscardBody`, `RenderDisabled`,
`EchoValue`, `ZoneRefresh` (a self-tearing-down timer that re-renders its host Zone),
`TriggerFragment` (a control toggles a FormFragment's visibility), and `Autocomplete`
(type-ahead over a page-supplied source) are all ported — the full marquee set (see
[BACKLOG.md](BACKLOG.md) §3).

| Component | Description | Qloom |
|---|---|:---:|
| Autocomplete | modifies a text field to provide for auto-completion of text using values retrieved from the server as the user types. Ported as a `@MixinAfter` mixin: fires a `provideCompletions` event whose handler (`onProvideCompletionsFrom<Id>`) returns matches sync or async; renders a dropdown with keyboard/mouse selection, a sequence-id stale-response guard, and auto-teardown. `minChars`/`maxSuggestions`/`debounce`. | ✅ |
| Confirm | attached to a Form or link component, gates the action behind a confirmation. Ported as an `@MixinAfter` mixin: writes `data-confirm-*` and a client capture-phase click-gate. | ✅ |
| DiscardBody | discards a component's body. Returns false from the BeforeRenderBody phase, which prevents the rendering of the body. Ported. | ✅ |
| FormFieldFocus | instruments the outer Form on which component the focus should be activated. Replaced by OverrideFieldFocus starting in Tapestry 5.4. | ☐ |
| FormGroup | attaches to a field to render an enclosing `<div>` element and label for proper Bootstrap markup of text fields, selects, and textareas | ☐ |
| NotEmpty | attaches to any component that renders an element. At the end of the render, if the element is empty, then a non-breaking space (&nbsp;) is injected into the element. | ☐ |
| OverrideFieldFocus | when attached to a form field, causes that field to gain focus. Starting in Tapestry 5.4, this supersedes FormFieldFocus. | ☐ |
| RenderClientId | forces a client element to render its client id by ensuring that "getClientId" is called. | ☐ |
| RenderDisabled | renders a "disabled" attribute if the containing component is disabled. Ported as an `@MixinAfter` mixin that reads the host field via `@InjectContainer`; **auto-applied to every field** via `@Mixin("renderdisabled")` on the `Field` base (as Tapestry's `AbstractField` does), so no template attaches it explicitly. | ✅ |
| RenderInformals | renders out all informal parameters, at the end of the BeginRender phase. This mixin can be used with components that render a single tag inside the BeginRender phase. | ☐ |
| RenderNotification | triggers component event notifications when the attached component enters its BeginRender and AfterRender render phases. | ☐ |
| TriggerFragment | when applied to a Checkbox or Radio component, links the input field and a FormFragment, making the field control the client-side visibility of the FormFragment. Ported as a `@MixinAfter` mixin: the control's `change` toggles the fragment's `display` (`fragment` = its `t:id`, `invert` supported); a hidden fragment's fields drop from submit via the Form's live-DOM check. | ✅ |
| ZoneRefresh | periodically refreshes a Zone by triggering an event on the server using ajax requests. Ported as an `@InjectContainer` mixin: a timer fires a `refresh` event then re-renders the zone locally (no server round-trip); the timer self-clears when the zone's element detaches. | ✅ |

## Tapestry Pages

| Component | Description | Qloom |
|---|---|:---:|
| ExceptionReport | Responsible for reporting runtime exceptions. This page is quite verbose and is usually overridden in a production application. | ☐ |
| PageCatalog | Lists out the currently loaded pages, with some statistics. | ☐ |
| PropertyDisplayBlocks | Contains blocks for displaying basic property types; the blocks are contributed to the BeanBlockSource service. | ☐ |
| PropertyEditBlocks | A page that exists to contain blocks used to edit different types of properties. The blocks on this page are contributed into the BeanBlockSource service configuration. | ☐ |
| ServiceStatus | A page used to see the status of all services defined by the Registry. | ☐ |

## Base Components

| Component | Description | Qloom |
|---|---|:---:|
| AbstractComponentEventLink | Base class for link-generating components that are based on a component event request. Such events have an event context and may also update a Zone. | ☐ |
| AbstractConditional | Base class for If and Unless. Will render its body or the block from its else parameter. If it renders anything and it has an element name, then it renders the element and its informal parameters. | ☐ |
| AbstractField | Provides initialization of the clientId and elementName properties. In addition, adds the RenderInformals, RenderDisabled and DiscardBody mixins. | 🟡 |
| _(Qloom `Field` base)_ | Qloom's equivalent field base: renders the `<input>`, two-way-binds `value`, discovers `@Validate`, registers with the `Form`, and carries `@Mixin("renderdisabled")` so every field auto-renders `disabled`. (RenderInformals is folded in directly via `applyInformals`; DiscardBody is not auto-attached.) | ✅ |
| AbstractLink | Provides base utilities for classes that generate clickable links. | ☐ |
| AbstractPropertyOutput | Base class for components that output a property value using a PropertyModel | ☐ |
| AbstractTextField | Abstract class for a variety of components that render some variation of a text field. Most of the hooks for user input validation are in this class | ☐ |
| BaseMessages | Base class for components that output messages | ☐ |

## Other Component Libraries

The source reference closes with an "Other Component Libraries" heading that points to [Modules](https://tapestry.apache.org/modules.html) rather than listing components. These are third-party/optional libraries outside `tapestry-core`, so there is no table to port and nothing for Qloom to implement here.

| Component | Description | Qloom |
|---|---|:---:|
| _(see Modules)_ | Optional third-party component libraries outside Tapestry core; no components enumerated on the reference page. | ☐ |

## Notes

- **Component-parity depth (completed 2026-08-01).** Ten components/behaviours that were previously present-but-partial are now fully modelled — each with a `@qloom/component-tests` suite (see [BACKLOG.md](BACKLOG.md) for the closed gaps):
  - **`Select`** — `blankOption` (ALWAYS/NEVER/AUTO) + `blankLabel` (AUTO conservatively omits the blank, a documented divergence — Qloom lacks the entity bean-validation required-signal).
  - **`Loop`** — `element` (wrap each iteration) and `empty` (a `<p:empty>` block). Inside a `<t:form>`, a loop of fields **round-trips every row's edit on submit** (each field re-establishes its row before writing) — Qloom replays over the live source, no `ValueEncoder` (use an object collection; primitives are output-only).
  - **`Submit`** — `mode` (cancel/unconditional) renders `data-submit-mode`; `Form` skips client-side validation for a bypassing submit.
  - **`FormFragment`** — fields inside a *hidden* fragment are excluded from submit validation.
  - **`AjaxFormLoop`** — rows carry a stable `data-key` so the reconciler matches by identity (value follows the item across a middle-row removal); editing existing rows **round-trips on submit** (same loop-in-form path as `Loop`).
  - **`LinkSubmit`/`Form`** — a double-submit guard suppresses the second submit of a rapid double-click.
  - **`KaptchaImage`** — clicking the image refreshes/regenerates the challenge.
  - **`Palette`** — select/deselect/double-click move controls, plus up/down in `reorder` mode.
  - **`Alerts`** — a real model: `div.alert.alert-<severity>` with markup-or-escaped message and a dismiss control, driven by a bound `source` or the shared `AlertStorage`.
- **Kaptcha** (`KaptchaField`/`KaptchaImage`) lives in Tapestry's separate `tapestry-kaptcha` module. Qloom ports both, reworked to verify the challenge behind the API (a browser-only SPA can't hold the answer server-side) — see PARITY.md.
- **`Grid`** (◐ rows above) renders headers with sort links (`GridColumns`), body rows (`GridRows`), data cells incl. `p:<column>Cell` overrides (`GridCell`), and the pager (`GridPager`) **all internally** — so those four are not ported as standalone components. They exist in Tapestry only to hand-assemble a bespoke grid layout, which no target `.tml` does; a `Grid` parameter would serve that more cheaply if it ever came up.
- **`Errors`** (all form errors) is implemented; **`Error`** (single-field) is not.
- **`<t:block>`** (named blocks) + **`Delegate`** give Qloom the multi-step/wizard pattern; `Block` is a template element, not listed as a component above.
- **Mixins, Tapestry Pages, and Base Components** are not ported — Qloom's class hierarchy and lifecycle differ (informal parameters, for example, are applied by components directly rather than via a `RenderInformals` mixin).
- Server-only or SSR-only components (`Doctype`, `ExceptionReport`, `PageCatalog`, `Upload`, …) are out of scope: Qloom is a browser-only SPA that fetches data via the API.
