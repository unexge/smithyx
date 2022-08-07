module.exports = grammar({
  name: "smithy",

  rules: {
    source_file: ($) =>
      seq(
        repeat($.ws),
        repeat($.control_section),
        repeat($.metadata_section),
        optional($.shape_section),
      ),

    ws: ($) => choice($.sp, $.newline, $.comment),

    sp: ($) => /[ \t]/,

    br: ($) => seq($.sp, choice($.comment, $.newline), $.sp),

    newline: ($) => /(\r\n|\r|\n)/,

    comment: ($) => choice($.documentation_comment, $.line_comment),

    documentation_comment: ($) => seq("///", repeat($.not_newline), $.br),

    line_comment: ($) => seq("//", repeat($.not_newline), $.newline),

    not_newline: ($) => /[^\S\r\n]/,

    control_section: ($) => $.control_statement,

    control_statement: ($) =>
      seq("$", repeat($.ws), $.node_object_key, repeat($.ws), ":", repeat($.ws), $.node_value, $.br),

    metadata_section: ($) => $.metadata_statement,

    metadata_statement: ($) =>
      seq(
        "metadata",
        repeat($.ws),
        $.node_object_key,
        repeat($.ws),
        "=",
        repeat($.ws),
        $.node_value,
        $.br
      ),

    node_value: ($) =>
      choice(
        $.node_array,
        $.node_object,
        $.number,
        $.node_keywords,
        $.node_string_value
      ),

    node_array: ($) => choice($.empty_node_array, $.populated_node_array),

    empty_node_array: ($) => seq("[", repeat($.ws), "]"),

    populated_node_array: ($) =>
      seq(
        "[",
        repeat($.ws),
        $.node_value,
        repeat($.ws),
        repeat(seq($.comma, $.node_value, repeat($.ws))),
        optional($.trailing_comma),
        "]"
      ),

    trailing_comma: ($) => $.comma,

    comma: ($) => seq(",", repeat($.ws)),

    node_object: ($) => choice($.empty_node_object, $.populated_node_object),

    empty_node_object: ($) => seq("{", repeat($.ws), "}"),

    populated_node_object: ($) =>
      seq(
        "{",
        repeat($.ws),
        $.node_object_kvp,
        repeat($.ws),
        repeat(seq($.comma, $.node_object_kvp, repeat($.ws))),
        optional($.trailing_comma),
        "}"
      ),

    node_object_kvp: ($) =>
      seq($.node_object_key, repeat($.ws), ":", repeat($.ws), $.node_value),

    node_object_key: ($) => choice($.quoted_text, $.identifier),

    number: ($) =>
      seq(optional($.minus), $.int, optional($.frac), optional($.exp)),

    decimal_point: ($) => ".",

    digit1_9: ($) => /[1-9]/,
    digit: ($) => /d/,

    e: ($) => choice("e", "E"),

    exp: ($) => seq($.e, optional(choice($.minus, $.plus)), repeat1($.digit)),

    frac: ($) => seq($.decimal_point, repeat1($.digit)),

    int: ($) => choice($.zero, seq($.digit1_9, repeat($.digit))),

    minus: ($) => "-",

    plus: ($) => "+",

    zero: ($) => "0",

    node_keywords: ($) => choice("true", "false", "null"),

    node_string_value: ($) => choice($.shape_id, $.text_block, $.quoted_text),

    quoted_text: ($) => seq($.dquote, repeat($.quoted_char), $.dquote),

    dquote: ($) => '"',

    quoted_char: ($) =>
      choice(/[ -!]/, /[#-[]/, /[]-]/, $.escaped_char, $.preserved_double),

    escaped_char: ($) =>
      seq(
        $.escape,
        choice(
          $.escape,
          "'",
          $.dquote,
          "b",
          "f",
          "n",
          "r",
          "t",
          "/",
          $.unicode_escape
        )
      ),

    unicode_escape: ($) => seq("u", $.hex, $.hex, $.hex, $.hex),

    hex: ($) => choice($.digit, /[A-F]/, /[a-f]/),

    preserved_double: ($) => seq($.escape, choice(/[ -!]/, /[#-[]/, /[]-]/)),

    escape: ($) => "\\",

    text_block: ($) =>
      seq($.three_dquotes, $.br, repeat($.quoted_char), $.three_dquotes),

    three_dquotes: ($) => seq($.dquote, $.dquote, $.dquote),

    shape_section: ($) =>
      seq(
        $.namespace_statement,
        repeat($.use_section),
        repeat($.shape_statements)
      ),

    namespace_statement: ($) => seq("namespace", repeat($.ws), $.namespace, $.br),

    use_section: ($) => $.use_statement,

    use_statement: ($) => seq("use", repeat($.ws), $.absolute_root_shape_id, $.br),

    shape_statements: ($) =>
      choice($.shape_statement, $.apply_statement),

    shape_statement: ($) => seq(repeat($.trait_statements), $.shape_body, $.br),

    shape_body: ($) =>
      choice(
        $.simple_shape_statement,
        $.list_statement,
        $.set_statement,
        $.map_statement,
        $.structure_statement,
        $.union_statement,
        $.service_statement,
        $.operation_statement,
        $.resource_statement
      ),

    simple_shape_statement: ($) => seq($.simple_type_name, repeat($.ws), $.identifier),

    simple_type_name: ($) =>
      choice(
        "blob",
        "boolean",
        "document",
        "string",
        "byte",
        "short",
        "integer",
        "long",
        "float",
        "double",
        "bigInteger",
        "bigDecimal",
        "timestamp"
      ),

    shape_members: ($) =>
      choice($.empty_shape_members, $.populated_shape_members),

    empty_shape_members: ($) => seq("{", repeat($.ws), "}"),

    populated_shape_members: ($) =>
      seq(
        "{",
        repeat($.ws),
        $.shape_member_kvp,
        repeat(seq($.comma, $.shape_member_kvp, repeat($.ws))),
        optional($.trailing_comma),
        "}"
      ),

    shape_member_kvp: ($) =>
      seq(repeat($.trait_statements), $.identifier, repeat($.ws), ":", repeat($.ws), $.shape_id),

    list_statement: ($) =>
      seq("list", repeat($.ws), $.identifier, repeat($.ws), $.shape_members),

    set_statement: ($) => seq("set", repeat($.ws), $.identifier, repeat($.ws), $.shape_members),

    map_statement: ($) => seq("map", repeat($.ws), $.identifier, repeat($.ws), $.shape_members),

    structure_statement: ($) =>
      seq("structure", repeat($.ws), $.identifier, repeat($.ws), $.shape_members),

    union_statement: ($) =>
      seq("union", repeat($.ws), $.identifier, repeat($.ws), $.shape_members),

    service_statement: ($) =>
      seq("service", repeat($.ws), $.identifier, repeat($.ws), $.node_object),

    operation_statement: ($) =>
      seq("operation", repeat($.ws), $.identifier, repeat($.ws), $.node_object),

    resource_statement: ($) =>
      seq("resource", repeat($.ws), $.identifier, repeat($.ws), $.node_object),

    trait_statements: ($) => seq($.ws, $.trait, $.ws),

    trait: ($) => seq("@", $.shape_id, optional($.trait_body)),

    trait_body: ($) => seq("(", repeat($.ws), $.trait_body_value, repeat($.ws), ")"),

    trait_body_value: ($) => choice($.trait_structure, $.node_value),

    trait_structure: ($) =>
      seq(
        $.trait_structure_kvp,
        repeat(seq(repeat($.ws), $.comma, $.trait_structure_kvp))
      ),

    trait_structure_kvp: ($) =>
      seq($.node_object_key, repeat($.ws), ":", repeat($.ws), $.node_value),

    apply_statement: ($) => seq("apply", repeat($.ws), $.shape_id, repeat($.ws), $.trait, $.br),

    shape_id: ($) => seq($.root_shape_id, optional($.shape_id_member)),

    root_shape_id: ($) => choice($.absolute_root_shape_id, $.identifier),

    absolute_root_shape_id: ($) => seq($.namespace, "#", $.identifier),

    namespace: ($) => seq($.identifier, repeat(seq(".", $.identifier))),

    identifier: ($) => seq($.identifier_start, repeat($.identifier_chars)),

    identifier_start: ($) => seq(repeat("_"), $.alpha),

    alpha: ($) => /[a-zA-Z]/,

    identifier_chars: ($) => choice($.alpha, $.digit, "_"),

    shape_id_member: ($) => seq("$", $.identifier),
  },
});
