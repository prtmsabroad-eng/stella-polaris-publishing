const wealthMessages = [
  "You are not waiting to be chosen. You are the one doing the choosing. Today is a $10,000 kind of day.",
  "Everything you have built is working. The seeds you planted are already growing. Receive it.",
  "You are a Cancer Rising with Jupiter on your North Node. The universe has been clearing the path. Walk.",
  "Nova is watching someone who does not apologize for taking up space. Be that person today.",
  "Your publishing company is real. Your advisory practice is real. Your legacy is already in motion.",
  "A $10,000 month does not require you to hustle harder. It requires you to stay aligned. You are aligned.",
  "The Law of Correspondence is always on. Your outer world is catching up to who you already are inside.",
  "You are the north star. Fixed. Brilliant. Everything navigates by you.",
  "Abundance is your birthright not your reward. You do not earn it. You allow it.",
  "You left comfort to build something real. That kind of courage compounds. Your investment is paying off.",
  "There are people who need exactly what you carry. They are on their way to find you.",
  "Your chart says this is the season. Your work says you are ready. Your job today is to show up.",
  "You are a professional chef, a clairvoyant strategist, a published author, and a homeschooling mother abroad. You are not ordinary. Act like it.",
  "The Kickstarter. The blog. The advisory practice. The app. You built all of that. In one season. Let that land.",
  "Money flows to clarity. You are clear. The flow is coming.",
  "You are raising a child who has never seen her mother shrink. That is the most powerful thing you have ever done.",
  "Your relocated Midheaven is conjunct your North Node. You are going to the place where you become fully visible. Almost there.",
  "Today someone will find your work and it will change something for them. That is why you keep going.",
  "You do not need to have it all figured out. You need to take the next right step. You already know what it is.",
  "Jupiter does not return to your North Node for 12 years. You are inside the window. Use every day of it.",
  "Your voice, your words, your books. Certifiably human authored. There is no one else who can do what you do.",
  "A thriving month is already written in this season's sky. Your only job is to not block what is coming.",
  "The blog is live. The calendar is set. The transits are in your favor. All systems are go.",
  "You are not behind. You are precisely on time for the life that was always meant for you.",
  "Every piece of content you post is a seed. Every seed has a 12-year Jupiter wind behind it right now.",
  "You built a publishing company from a vision, a laptop, and your daughter's name. That is founder energy.",
  "The universe is conspiring in your favor. Not eventually. Right now. Today. This moment.",
  "Your ancestors cleared ground you have not even reached yet. Walk forward like the path is already yours.",
  "You are somebody's answered prayer. The person who needed to find you is searching right now.",
  "New home. New chapter. New country. Same north star. You always knew where you were going."
];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim().then(() => scheduleNotification()));
});

function getDailyMessage() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return wealthMessages[dayOfYear % wealthMessages.length];
}

function scheduleNotification() {
  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  const ms = target - now;
  setTimeout(() => {
    self.registration.showNotification('✦ Stella Polaris', {
      body: getDailyMessage(),
      icon: '/favicon.png',
      badge: '/favicon.png'
    });
    scheduleNotification();
  }, ms);
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/studio.html'));
});

// Server-sent push (new lead alerts)
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || '✦ New Lead', {
      body: data.body || 'Someone just submitted your advisory form.',
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: 'new-lead',
      renotify: true,
      data: { url: data.url || '/studio.html' }
    })
  );
});
