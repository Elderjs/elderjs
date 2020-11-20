describe('#rollupPlugin', () => {
  it('', () => {});

  it('', () => {});
  it('', () => {});
  it('', () => {});
  it('', () => {});
  it('', () => {});

  describe('#encodeSourceMap', () => {
    it('properly generates an encoded string', () => {});
  });
  describe('#getDependencies', () => {
    it('finds deep dependencies', () => {});
    it("doesn't crash on circular deps", () => {});
  });

  describe('#cssFilePriority', () => {
    it('properly maps components', () => {});
    it('properly maps routes', () => {});
    it('properly maps layouts', () => {});
  });

  describe('#sortCss', () => {
    it('sorts by priority', () => {});
    it('sports by priority 2', () => {});
  });

  describe('#getCompleteCss', () => {
    it('get css of self and dependency', () => {});
    it('gets css of self, dep, and sub dep', () => {});
  });

  describe('#logDependency', () => {
    it('It adds a css file as a dependency when it is imported.', () => {});
    it('It adds the importee as the dependency of the importer', () => {});
  });
});
