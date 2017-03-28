function User(profile, options) {
  this.id = uuid.v4();
  this.memos = [];
  this.role = options.role || ROLE.USER;
  this.profile = profile;
}
User.prototype.addMemo = function(title, description) {
  let memo = new Memo({title, description, ownerId: this.id});
  memoList.push(memo);
  this.memos.push(memo.id);
};
User.create = function(name, email, phone) {
  var user = new User({name, email, phone}, {role: ROLE.ADMIN});
  userList.push(user);
  return user;
};