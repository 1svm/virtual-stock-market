function Memo(options) {
  this.id = uuid.v4();
  this.ownerId = options.ownerId;
  this.createdAt = new Date();
  this.isActive = true;
  this.isCompleted = false;
}