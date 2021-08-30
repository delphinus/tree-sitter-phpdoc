const PHP = require('tree-sitter-php/grammar');

// PHPDoc reference: https://docs.phpdoc.org/3.0/guide/references/phpdoc/index.html
// TODO array return types https://docs.phpdoc.org/3.0/guide/references/phpdoc/types.html#arrays
// PHPDoc tags: https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/index.html#tag-reference
// PHPDoc docs appear to use these conventions
//   @verbatimElement [required element] [<optional element>]

module.exports = grammar({
  name: 'phpdoc',

  extras: $ => [
    token(
      seq(/(\r)|(\r\n)|(\n)/, /[ \t]*/, repeat('*'), /[ \t]*/)
    ),
    token(
      seq(/[ \t]*/, repeat('*'), /[ \t]*/)
    ),
    token(repeat1(' ')),
  ],

  conflicts: $ => [
    [$.primitive_type, $.static],
    [$.namespace_name],
    [$.namespace_name_as_prefix],
  ],

  word: $ => $.name,

  rules: {
    document: $ => seq(
      $._begin,
      optional($.description),
      repeat($.tag),
      $._end,
    ),

    _begin: $ => token(seq('/**', repeat('*'))),

    tag: $ => choice(

      $._simple_tag_without_description,
      $._simple_tag_with_optional_description,
      $._simple_tag_with_required_description,

      seq(
          alias($._currently_incomplete_tags, $.tag_name),
          optional($.description)
      ),

      $._author_tag,
      $._global_tag,
      $._internal_tag,
      $._link_tag,
      $._method_tag,
      $._param_tag,
      $._property_tag,
      $._return_tag,
      $._see_tag,
      $._throws_tag,
      $._var_tag,
      $._version_tag,
    ),

    // @inheritDoc is inline only, has no description
    inline_tag: $ => prec(-1, seq(
      '{',
      choice(
        alias("@inheritDoc", $.tag_name),
        $._internal_inline_tag,
        $._link_inline_tag,
        $._see_inline_tag,
      ),
      '}'
    )),

    // @api
    // @filesource
    _simple_tag_without_description: $ => alias(
      choice(
        '@api',
        '@filesource',
      ),
      $.tag_name
    ),

    // @ignore [<description>]
    _simple_tag_with_optional_description: $ => seq(
      alias(
        '@ignore',
        $.tag_name
      ),
      optional($.description)
    ),

    // @category [description]
    // @copyright [description]
    // @todo [description]
    _simple_tag_with_required_description: $ => seq(
      alias(
        choice(
          '@category',
          '@copyright',
          '@todo',
        ),
        $.tag_name
      ),
      $.description
    ),

    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/subpackage.html
    // @subpackage [name]

    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/example.html
    // @example [location] [<start-line> [<number-of-lines>] ] [<description>]
    // (also inline)

    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/license.html
    // @license [<url>] [name]
    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/package.html
    // @package [level 1]\\[level 2]\\[etc.]
    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/source.html
    // @source [<start-line> [<number-of-lines>] ] [<description>]
    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/uses.html
    // @uses [FQSEN] [<description>]
    _currently_incomplete_tags: $ => choice(
        '@example',
        '@license',
        '@package',
        '@source',
        '@subpackage',
        '@uses'
    ),

    // @author [name] [<email address>]
    _author_tag: $ => seq(
      alias('@author', $.tag_name),
      optional(
        seq($.author_name, optional(seq('<', $.email_address, '>')))
      )
    ),

    // @global [Type] [name] (name w/o $)
    // @global [Type] [description]
    _global_tag: $ => seq(
      alias('@global', $.tag_name),
      $._type_name,
      $.variable_name
    ),

    // @internal [description]
    _internal_tag: $ => seq(
      alias('@internal', $.tag_name),
      optional($.description)
    ),

    _internal_inline_tag: $ => seq(
      alias('@internal', $.tag_name),
      alias($.text, $.description)
    ),

    // @link [URI] [<description>]
    _link_tag: $ => seq(
      alias('@link', $.tag_name),
      choice(
        $.uri,
        $.qualified_name,
        seq($.qualified_name, '()'),
      ),
      optional($.description)
    ),

    _link_inline_tag: $ => seq(
      alias('@link', $.tag_name),
      choice(
        $.uri,
        $.qualified_name,
        seq($.qualified_name, '()'),
      ),
      optional(alias($.text, $.description))
    ),

    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/method.html#method
    // @method [[static] return type] [name]([[type] [parameter]<, ...>]) [<description>]
    _method_tag: $ => seq(
      alias('@method', $.tag_name),
      // interpreting `[static]` as optional despite not being in [<...>]
      optional($.static),
      $._type,
      $.name,
      $.parameters,
      optional($.description),
    ),

    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/param.html
    // @param [<Type>] [name] [<description>]
    _param_tag: $ => seq(
      alias('@param', $.tag_name),
      optional($._type),
      $.variable_name,
      optional($.description),
    ),

    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/property.html
    // @property[<-read|-write>] [Type] [name] [<description>]
    _property_tag: $ => seq(
      alias(choice(
        '@property',
        '@property-read',
        '@property-write',
      ), $.tag_name),
      $._type,
      $.variable_name,
      optional($.description),
    ),

    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/return.html
    // @return [Type] [<description>]
    _return_tag: $ => seq(
      alias('@return', $.tag_name),
      $._type_name,
      optional($.description),
    ),

    // https://docs.phpdoc.org/3.0/guide/references/phpdoc/tags/see.html
    // @see [URI | FQSEN] [<description>]
    _see_tag: $ => seq(
      alias('@see', $.tag_name),
      $.uri,
      $.description,
    ),

    _see_inline_tag: $ => seq(
      alias('@see', $.tag_name),
      $.uri,
      optional(alias($.text, $.description))
    ),

    // @throws [Type] [<description>]
    _throws_tag: $ => seq(
      alias('@throws', $.tag_name),
      $._type_name,
      optional($.description),
    ),

    // @var ["Type"] [element_name] [<description>]
    _var_tag: $ => seq(
      alias('@var', $.tag_name),
      $._type,
      optional($.variable_name),
      optional($.description),
    ),

    // @deprecated [<Semantic Version>] [<description>]
    // @since [<Semantic Version>] [<description>]
    // @version [<Semantic Version>] [<description>]
    _version_tag: $ => seq(
      alias(
        choice(
          '@deprecated',
          '@since',
          '@version'
        ),
        $.tag_name
      ),
      optional($.version),
      optional($.description),
    ),

    author_name: $ => /[a-zA-Zα-ωΑ-Ωµ0-9_][ a-zA-Zα-ωΑ-Ωµ0-9_]*/,

    email_address: $ => /\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+/,

    description: $ => seq(
      repeat1(choice($.text, $.inline_tag)),
    ),

    text: $ => token(prec(-1, /[^@*\s\n{}][^\n{}*]*/)),

    version: $ => /[\.0-9]+/,

    uri: $ => /\w+:(\/?\/?)[^\s}]+/,

    name: $ => PHP.rules.name,
    // PHP.rules._type creates an alias for $.type_list
    _type: $ => PHP.rules._type,
    union_type: $ => PHP.rules.union_type,
    optional_type: $ => PHP.rules.optional_type,
    _types: $ => PHP.rules._types,
    named_type: $ => PHP.rules.named_type,
    primitive_type: $ => PHP.rules.primitive_type,

    _type_name: $ => seq(
      alias($.qualified_name, $.type),
      repeat(seq('|', alias($.qualified_name, $.type)))
    ),

    parameters: $ => seq(
      '(',
      sep($.parameter, ','),
      ')',
    ),

    parameter: $ => seq(
      optional($._type),
      $.variable_name,
      optional(seq(
        '=',
        $.default_value,
      )),
    ),

    default_value: $ => /[^, ][^,)]*/,

    qualified_name: $ => PHP.rules.qualified_name,
    namespace_name_as_prefix: $ => PHP.rules.namespace_name_as_prefix,
    namespace_name: $ => PHP.rules.namespace_name,


    static: $ => 'static',

    variable_name: $ => PHP.rules.variable_name,

    _end: $ => '*/',
  },
})

function sep1(rule, sep) {
  return seq(rule, repeat(seq(sep, rule)));
}

function sep(rule, sep) {
  return optional(sep1(rule, sep));
}
