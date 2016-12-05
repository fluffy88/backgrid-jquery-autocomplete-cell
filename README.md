# backgrid-jquery-autocomplete-cell
A Backgrid extension that adds support for jQuery Autocomplete as a cell editor

When an `autoComplete` cell enters edit mode it will render a [jQuery Autocomplete widget](http://jqueryui.com/autocomplete/) with a list of options allowing the user select an item using either the keyboard or mouse.

This cell was built as a replacement for the standard Backgrid `select-cell` which IMHO doesn't behave very well.

## Usage
The Backgrid jQuery Autocomplete cell defines a new cell type `autoComplete`.

The list of options is controlled via the attribute `autoCompleteOptions`.  This attribute is similar to the [jQuery Autocomplete source attribute](http://api.jqueryui.com/autocomplete/#option-source).  It supports hardcoded data in the column definition in the form of `["abc", ...]` or `[{label: "", value: ""}, ...]`.  In addition the `autoCompleteOptions` attribute can also be a function which returns an Ajax deferred object.  The deferred response must be in the same form as described above.

If you are working with an API which provides data in another form you can also define a `parse` attribute which will be used in the deferred response to parse the response into a form which is accepted by the Autocomplete cell.

### Basic example
- Define the cell as an `autoComplete`.
- Set array of options in `autoCompleteOptions` attribute.
```
var grid = new Backgrid.Grid({
  columns: [{
      label: "Name",
      name: "name",
      cell: "string"
  }, {
      label: "Country",
      name: "country",
      cell: "autoComplete",
      autoCompleteOptions: ["America", "Canada", "Denmark", "England", "Ireland", "Japan", "New Zealand", "Spain"]
  }]
});
```

### Deferred example
- Define the cell as an `autoComplete`.
- Set `autoCompleteOptions` attribute as function which returns an array containing the options.
```
var grid = new Backgrid.Grid({
  columns: [{
      label: "Name",
      name: "name",
      cell: "string"
  }, {
      label: "Country",
      name: "country",
      cell: "autoComplete",
      autoCompleteOptions: ["America", "Canada", "Denmark", "England", "Ireland", "Japan", "New Zealand", "Spain"]
  }, {
      label: "Post Code",
      name: "post_code",
      cell: "autoComplete",
      autoCompleteOptions: function() {
        return $.get({
          url: "/api/post_codes?country=" + this.model.get("country"),
          dataType: "json"
        });
      }
  }]
});
```
### Parse example
- Define the cell as an `autoComplete`.
- Set `autoCompleteOptions` attribute as function which returns an array containing the options.
- Set a `parse` attribute as function which will parse the deferred response.
```
var grid = new Backgrid.Grid({
  columns: [{
      label: "Name",
      name: "name",
      cell: "string"
  }, {
      label: "Country",
      name: "country",
      cell: "autoComplete",
      autoCompleteOptions: function() {
        return $.get({
          url: "/api/countries",
          dataType: "json"
        });
      },
      parse: function(response) {
        return response.countries;
      }
  }]
});
```
