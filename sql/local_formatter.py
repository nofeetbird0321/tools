import re


class FormatConfig:
    def __init__(self, indent_size=4, select_field_indent=6, comma_indent=4):
        self.indent_size = indent_size
        self.select_field_indent = select_field_indent
        self.comma_indent = comma_indent


class LocalSQLFormatter:
    """The rule-based formatter extracted from the supplied Python script."""

    def __init__(self, config=None):
        self.config = config or FormatConfig()
        self.keywords = {
            'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
            'WITH', 'AS', 'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
            'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
            'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'JOIN', 'ON',
            'AND', 'OR', 'NOT', 'IN', 'NOT IN', 'EXISTS', 'NOT EXISTS',
            'BETWEEN', 'NOT BETWEEN', 'LIKE', 'NOT LIKE', 'ILIKE', 'NOT ILIKE',
            'IS NULL', 'IS NOT NULL', 'IS TRUE', 'IS FALSE', 'IS NOT TRUE', 'IS NOT FALSE',
            'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'OVER', 'PARTITION BY',
            'ROWS', 'RANGE', 'UNBOUNDED', 'PRECEDING', 'FOLLOWING', 'CURRENT ROW',
            'DISTINCT', 'ALL', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
            'CREATE', 'DROP', 'ALTER', 'TABLE', 'VIEW', 'INDEX', 'DATABASE', 'SCHEMA',
            'LIMIT', 'OFFSET', 'TOP', 'FETCH', 'FIRST', 'NEXT', 'ONLY',
        }
        self.functions = {
            'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'STDDEV', 'VARIANCE',
            'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD',
            'FIRST_VALUE', 'LAST_VALUE', 'CONCAT', 'SUBSTRING', 'SUBSTR',
            'LENGTH', 'LEN', 'TRIM', 'LTRIM', 'RTRIM', 'UPPER', 'LOWER',
            'REPLACE', 'SPLIT', 'REGEXP_REPLACE', 'REGEXP_EXTRACT', 'DATE_ADD',
            'DATE_SUB', 'DATEDIFF', 'DATE_FORMAT', 'DATE_TRUNC', 'EXTRACT',
            'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'NOW',
            'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CAST', 'CONVERT',
            'TRY_CAST', 'TRY_CONVERT', 'IF', 'IIF', 'COALESCE', 'NULLIF',
            'ISNULL', 'IFNULL', 'GET_JSON_OBJECT', 'JSON_EXTRACT', 'JSON_VALUE',
            'JSON_QUERY', 'ABS', 'CEIL', 'CEILING', 'FLOOR', 'ROUND', 'POWER', 'SQRT',
        }
        self.main_clauses = [
            'WITH', 'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY',
            'HAVING', 'UNION', 'UNION ALL', 'LIMIT', 'OFFSET'
        ]
        self.join_types = [
            'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
            'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'JOIN'
        ]

    def format_sql(self, sql):
        if not sql.strip():
            return sql
        protected = []

        def hold(match):
            protected.append(match.group(0))
            return f'__SQL_LITERAL_{len(protected) - 1}__'

        sql = re.sub(
            r"(--[^\n]*|/\*.*?\*/|'(?:''|[^'])*'|\"(?:\"\"|[^\"])*\"|`(?:``|[^`])*`)",
            hold,
            sql,
            flags=re.DOTALL,
        )
        sql = re.sub(r'\s+', ' ', sql).strip()
        terms = sorted(self.keywords | self.functions, key=len, reverse=True)
        for term in terms:
            pattern = rf'\b{re.escape(term)}\b'
            sql = re.sub(pattern, term.upper(), sql, flags=re.IGNORECASE)

        clauses = [re.escape(x) for x in self.main_clauses + self.join_types + ['ON']]
        parts = re.split(r'\b(' + '|'.join(clauses) + r')\b', sql, flags=re.IGNORECASE)
        tokens = [part.strip() for part in parts if part.strip()]
        lines = []
        i = 0
        while i < len(tokens):
            token = tokens[i]
            upper = token.upper()
            if upper.startswith('SELECT'):
                lines.append(token)
                i += 1
                fields = []
                while i < len(tokens) and not self._is_major_clause(tokens[i]):
                    fields.append(tokens[i].strip())
                    i += 1
                fields = [x.strip() for x in ' '.join(fields).split(',') if x.strip()]
                if fields:
                    lines.append(' ' * self.config.select_field_indent + fields[0])
                    lines.extend(' ' * self.config.comma_indent + ', ' + x for x in fields[1:])
                continue
            if self._is_major_clause(token):
                lines.append(token)
                i += 1
                content = []
                while i < len(tokens) and not self._is_major_clause(tokens[i]):
                    content.append(tokens[i].strip())
                    i += 1
                if content:
                    lines.append(' ' * self.config.indent_size + ' '.join(content))
                continue
            if self._is_join_clause(token):
                lines.append(token)
            else:
                lines.append(' ' * self.config.indent_size + token)
            i += 1
        result = '\n'.join(lines)
        for index, fragment in enumerate(protected):
            result = result.replace(f'__SQL_LITERAL_{index}__', fragment)
        return result

    def _is_major_clause(self, token):
        value = token.upper().strip()
        return any(value.startswith(clause) for clause in self.main_clauses)

    def _is_join_clause(self, token):
        value = token.upper().strip()
        return any(value.startswith(join) for join in self.join_types)


def format_sql(sql):
    return LocalSQLFormatter().format_sql(sql)
