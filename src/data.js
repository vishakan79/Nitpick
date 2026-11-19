// Sample data for the demo workspace. The Spring Boot API will replace this later.

export const SEV = {
  critical: { label: 'Critical', tag: 'bg-pen text-white', bar: '#E4484F', edge: 'border-pen' },
  warning: { label: 'Warning', tag: 'bg-hl text-ink', bar: '#FFD84A', edge: 'border-hl' },
  suggestion: { label: 'Suggestion', tag: 'bg-azure text-white', bar: '#2D55E8', edge: 'border-azure' },
}

export const repos = [
  { name: 'order-service', on: true },
  { name: 'payments-api', on: true },
  { name: 'inventory-ui', on: true },
  { name: 'legacy-batch', on: false },
]

export const prs = [
  { id: 214, title: 'Add refund endpoint', repo: 'payments-api', author: 'Priya', status: 'running', score: null, when: '4 min ago', c: 0, w: 0, s: 0 },
  { id: 213, title: 'Fix N+1 in order list', repo: 'order-service', author: 'Arun', status: 'reviewed', score: 92, when: '22 min ago', c: 0, w: 1, s: 3 },
  { id: 212, title: 'JWT refresh rotation', repo: 'order-service', author: 'Arun', status: 'reviewed', score: 68, when: '1 hr ago', c: 1, w: 2, s: 2 },
  { id: 211, title: 'Inventory table filters', repo: 'inventory-ui', author: 'Meena', status: 'reviewed', score: 88, when: '3 hr ago', c: 0, w: 1, s: 4 },
  { id: 210, title: 'Raw SQL report query', repo: 'payments-api', author: 'Karthik', status: 'reviewed', score: 41, when: '5 hr ago', c: 3, w: 2, s: 1 },
  { id: 209, title: 'Upgrade Spring Boot to 3.4', repo: 'order-service', author: 'Arun', status: 'queued', score: null, when: '1 day ago', c: 0, w: 0, s: 0 },
  { id: 208, title: 'Cache product lookups', repo: 'order-service', author: 'Meena', status: 'reviewed', score: 85, when: '1 day ago', c: 0, w: 2, s: 2 },
  { id: 207, title: 'Add Flyway migrations', repo: 'payments-api', author: 'Priya', status: 'reviewed', score: 90, when: '2 days ago', c: 0, w: 0, s: 3 },
  { id: 206, title: 'Rate limit the login endpoint', repo: 'order-service', author: 'Karthik', status: 'reviewed', score: 74, when: '2 days ago', c: 1, w: 1, s: 2 },
  { id: 205, title: 'Fix date parsing bug', repo: 'inventory-ui', author: 'Meena', status: 'reviewed', score: 95, when: '3 days ago', c: 0, w: 0, s: 1 },
]

export const trend = [
  71, 73, 72, 75, 74, 77, 76, 78, 77, 80, 79, 81, 80, 82, 81, 79, 82, 84, 83, 85, 84, 86, 85, 83, 86, 88, 87, 89, 88, 90,
]

export const findings = [
  { id: 1, pr: 210, repo: 'payments-api', file: 'ReportRepository.java', line: 13, sev: 'critical', cat: 'Security', msg: 'SQL is built by joining strings, so user input can change the query.' },
  { id: 2, pr: 210, repo: 'payments-api', file: 'ReportRepository.java', line: 31, sev: 'critical', cat: 'Security', msg: 'Same pattern here: the date range is concatenated into the query.' },
  { id: 3, pr: 210, repo: 'payments-api', file: 'ReportService.java', line: 58, sev: 'warning', cat: 'Performance', msg: 'This loads the whole table into memory before filtering.' },
  { id: 4, pr: 212, repo: 'order-service', file: 'TokenService.java', line: 43, sev: 'critical', cat: 'Security', msg: 'Refresh tokens are not invalidated after use, so a stolen token works forever.' },
  { id: 5, pr: 212, repo: 'order-service', file: 'TokenService.java', line: 45, sev: 'warning', cat: 'Bug', msg: 'Returning null for an expired token causes a NullPointerException in the caller.' },
  { id: 6, pr: 213, repo: 'order-service', file: 'OrderService.java', line: 29, sev: 'warning', cat: 'Performance', msg: 'One query per order. Load all customers with a single findAllById call.' },
  { id: 7, pr: 211, repo: 'inventory-ui', file: 'FilterBar.tsx', line: 72, sev: 'warning', cat: 'Bug', msg: 'This effect depends on an object created on every render, so it runs in a loop.' },
  { id: 8, pr: 206, repo: 'order-service', file: 'LoginController.java', line: 24, sev: 'critical', cat: 'Security', msg: 'The rate limit key uses the X-Forwarded-For header, which clients can set themselves.' },
  { id: 9, pr: 208, repo: 'order-service', file: 'ProductCache.java', line: 17, sev: 'warning', cat: 'Bug', msg: 'The cache has no expiry, so price changes never show up.' },
  { id: 10, pr: 214, repo: 'payments-api', file: 'RefundService.java', line: 22, sev: 'suggestion', cat: 'Testing', msg: 'No test covers a refund larger than the amount paid.' },
  { id: 11, pr: 211, repo: 'inventory-ui', file: 'InventoryTable.tsx', line: 9, sev: 'suggestion', cat: 'Style', msg: 'Prefer a named type over an inline object type repeated in three props.' },
  { id: 12, pr: 207, repo: 'payments-api', file: 'V4__add_index.sql', line: 3, sev: 'suggestion', cat: 'Performance', msg: 'Create this index concurrently so the table is not locked while it builds.' },
]

export const initialRules = [
  { id: 1, text: 'Always use parameterized SQL. Never build queries by joining strings.', on: true },
  { id: 2, text: 'Controllers must not call repositories directly. Go through a service.', on: true },
  { id: 3, text: 'No System.out.println. Use the logger.', on: true },
  { id: 4, text: 'Every public service method needs a unit test.', on: true },
  { id: 5, text: 'Do not catch Exception without logging or rethrowing it.', on: false },
  { id: 6, text: 'Use constructor injection, not @Autowired fields.', on: true },
]

// A comment has English and Tanglish text. Backticks mark inline code.
export const comments = {
  sql: {
    sev: 'critical',
    cat: 'Security',
    en: 'This query is built by joining strings, so `id` can change what the query does. A value like `x\' OR \'1\'=\'1` would return every order. Bind it as a parameter.',
    ta: 'Idhu string-a join panni query ezhudhirukinga, so `id` vazhiya yaaru venumnaalum query-a maathalaam. `x\' OR \'1\'=\'1` kudutha ella orders-um varum. Parameter-a bind pannunga.',
    fix: 'jdbc.queryForObject("SELECT * FROM orders WHERE id = ?", mapper, id);',
  },
  nplus1: {
    sev: 'warning',
    cat: 'Performance',
    en: 'This runs one database call per item. An order with 50 items makes 51 queries. Fetch all the products in one query and look them up in a map.',
    ta: 'Oru item-ku oru DB call pogudhu. 50 items irundha 51 queries aagum. Ella products-um ore query-la eduthu, map-la thedunga.',
    fix: 'var products = productRepo.findAllById(ids);',
  },
  nullexp: {
    sev: 'warning',
    cat: 'Bug',
    en: 'Returning `null` for an expired token makes the caller fail with a NullPointerException two layers up. Throw a `TokenExpiredException` so the API can answer 401.',
    ta: 'Expired token-ku `null` return panna, rendu layer mela NullPointerException varum. `TokenExpiredException` throw pannunga, appo API 401 sollum.',
    fix: 'throw new TokenExpiredException(claims.getId());',
  },
  tests: {
    sev: 'suggestion',
    cat: 'Testing',
    en: '`create` has three branches (full refund, partial refund, amount over the paid total) and no test covers any of them. Here is a starting point for the over-total case.',
    ta: '`create`-la moonu branches irukku (full, partial, paid amount-ku mela). Edhukkum test illa. Over-total case-ku oru starting test inge irukku.',
    fix: 'assertThrows(RefundTooLargeException.class, () -> service.create(req(150, 100)));',
  },
  inject: {
    sev: 'suggestion',
    cat: 'Style',
    en: 'Field injection hides what this class depends on and makes it hard to test. Take `OrderRepository` in the constructor instead.',
    ta: 'Field injection la dependency theriyaadhu, test panna kashtam. `OrderRepository`-a constructor-la vaanguinga.',
    fix: 'public OrderController(OrderRepository repo) { this.repo = repo; }',
  },
}

// Diff snippets for the "what it catches" tabs
export const catches = [
  {
    key: 'Security',
    title: 'Security holes',
    blurb: 'SQL injection, secrets in code, missing auth checks and unsafe deserialization.',
    file: 'ReportRepository.java',
    lines: [
      { n: 12, t: 'public List<Row> byOwner(String name) {', k: 'ctx' },
      { n: 13, t: '    var q = "SELECT * FROM rows WHERE owner = \'" + name + "\'";', k: 'add', c: 'sql' },
      { n: 14, t: '    return jdbc.query(q, mapper);', k: 'add' },
      { n: 15, t: '}', k: 'ctx' },
    ],
    commentKey: 'sql',
  },
  {
    key: 'Bugs',
    title: 'Logic bugs',
    blurb: 'Null handling, off-by-one errors, wrong comparisons and loops that never end.',
    file: 'TokenService.java',
    lines: [
      { n: 44, t: 'if (claims.getExpiration().before(new Date())) {', k: 'ctx' },
      { n: 45, t: '    return null;', k: 'add', c: 'nullexp' },
      { n: 46, t: '}', k: 'ctx' },
      { n: 47, t: 'return issue(claims.getSubject());', k: 'ctx' },
    ],
    commentKey: 'nullexp',
  },
  {
    key: 'Performance',
    title: 'Slow code',
    blurb: 'N+1 queries, missing indexes, work done inside loops and unbounded result sets.',
    file: 'OrderService.java',
    lines: [
      { n: 27, t: 'for (Order o : orders) {', k: 'ctx' },
      { n: 28, t: '    o.setCustomer(customerRepo.findById(o.getCustomerId()));', k: 'add', c: 'nplus1' },
      { n: 29, t: '}', k: 'ctx' },
    ],
    commentKey: 'nplus1',
  },
  {
    key: 'Tests',
    title: 'Missing tests',
    blurb: 'New branches nobody tests, with a starting test written for you.',
    file: 'RefundService.java',
    lines: [
      { n: 20, t: 'public Refund create(RefundRequest r) {', k: 'add', c: 'tests' },
      { n: 21, t: '    if (r.amount() > paid(r.orderId())) throw new RefundTooLargeException();', k: 'add' },
      { n: 22, t: '    return r.full() ? full(r) : partial(r);', k: 'add' },
      { n: 23, t: '}', k: 'add' },
    ],
    commentKey: 'tests',
  },
  {
    key: 'Style',
    title: 'Team conventions',
    blurb: 'Your own rules, written in plain sentences, checked on every pull request.',
    file: 'OrderController.java',
    lines: [
      { n: 8, t: '@RestController', k: 'ctx' },
      { n: 9, t: 'public class OrderController {', k: 'ctx' },
      { n: 10, t: '    @Autowired private OrderRepository repo;', k: 'add', c: 'inject' },
    ],
    commentKey: 'inject',
  },
]

// Full diff for the pull request detail screen
export const detailDiff = {
  file: 'src/main/java/com/shop/orders/OrderController.java',
  lines: [
    { n: 18, t: '@GetMapping("/orders/{id}")', k: 'ctx' },
    { n: 19, t: 'public Order find(@PathVariable String id) {', k: 'ctx' },
    { n: 20, t: '    String sql = "SELECT * FROM orders WHERE id = \'" + id + "\'";', k: 'add', c: 'sql' },
    { n: 21, t: '    Order o = jdbc.queryForObject(sql, mapper);', k: 'add' },
    { n: 22, t: '    for (Item i : o.getItems()) {', k: 'add' },
    { n: 23, t: '        i.setProduct(productRepo.findById(i.getProductId()));', k: 'add', c: 'nplus1' },
    { n: 24, t: '    }', k: 'add' },
    { n: 25, t: '    return o;', k: 'add' },
    { n: 26, t: '}', k: 'ctx' },
  ],
}

export const faq = [
  {
    q: 'Which languages does Nitpick review?',
    a: 'Any language that shows up in a GitHub diff. It is tuned for Java, TypeScript, Python, Go and SQL, and it skips lockfiles and generated code so the comments stay on your own work.',
  },
  {
    q: 'Does it store my code?',
    a: 'No. The diff is sent to the model to write the review and is dropped once the comments are posted. Nitpick keeps the findings, the file names and the scores so your dashboard works.',
  },
  {
    q: 'Will it block my merges?',
    a: 'Not by default. Nitpick leaves a normal review with inline comments. If you want it to fail a status check on critical findings, you can switch that on per repository.',
  },
  {
    q: 'How do custom rules work?',
    a: 'Write a rule as a plain sentence, like "Controllers must not call repositories directly." Nitpick checks every pull request against your enabled rules and flags the lines that break them.',
  },
  {
    q: 'What is Tanglish mode?',
    a: 'Explanations written in Tamil and English mixed together, the way many Tamil developers talk about code. Turn it on per repository, and the comments on GitHub change with it.',
  },
  {
    q: 'How long does a review take?',
    a: 'Small pull requests usually finish in under a minute. Large diffs are split by file and reviewed in parallel, so a big change does not wait in a single long queue.',
  },
]
