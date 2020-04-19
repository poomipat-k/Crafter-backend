const template = (url) => {
  return `<span style="font-size: 24px">Please click the link below to activate your Craftorful account by click <a href="${url}">HERE</a></span><br>
  <span style="font-size: 18px; color: red;">If you did not register for an account at Craftorful.com, please ignore this email and not click on the link.</span>`;
};

module.exports = {
  template,
};
