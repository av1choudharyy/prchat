import React, { useState, useEffect } from 'react';

import {
    Box,
    Button,
    HStack,
    useColorMode
} from '@chakra-ui/react';

const SmartReplySuggestions = ({ messages, onSuggestionClick, currentUser, isVisible = true }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [lastReceivedMessageId, setLastReceivedMessageId] = useState(null);
    const [userHasReplied, setUserHasReplied] = useState(false);
    const { colorMode } = useColorMode();

    // Analysis patterns for generating smart replies
    const patterns = {
        // 🔹 GREETINGS & BASIC INTERACTIONS
        morning_greetings: {
            keywords: ['good morning', 'morning', 'gm', 'rise and shine', 'wake up'],
            responses: ['Good morning! ☀️', 'Morning!', 'Have a great day!', 'Rise and shine!', 'GM!', 'Early bird!']
        },
        evening_greetings: {
            keywords: ['good evening', 'evening', 'good afternoon', 'afternoon'],
            responses: ['Good evening!', 'Evening!', 'Good afternoon!', 'Hey there!', 'How\'s your day?']
        },
        night_greetings: {
            keywords: ['good night', 'goodnight', 'gn', 'sleep well', 'sweet dreams', 'bedtime'],
            responses: ['Good night! 🌙', 'Sweet dreams!', 'Sleep tight!', 'Night night!', 'Rest well!', 'Pleasant dreams!']
        },
        casual_greetings: {
            keywords: ['hello', 'hi', 'hey', 'sup', 'yo', 'wassup', 'howdy'],
            responses: ['Hey!', 'Hi there!', 'What\'s up!', 'Hey, how\'s it going?', 'Yo!', 'Howdy!', 'Sup!']
        },

        // 🔹 EMOTIONS & FEELINGS
        happiness: {
            keywords: ['happy', 'excited', 'thrilled', 'amazing', 'fantastic', 'wonderful', 'great news', 'celebrating'],
            responses: ['That\'s awesome!', 'So happy for you!', 'Yay! 🎉', 'Amazing!', 'Love that energy!', 'Fantastic!']
        },
        sadness: {
            keywords: ['sad', 'upset', 'down', 'depressed', 'crying', 'tears', 'heartbroken', 'devastated'],
            responses: ['I\'m sorry to hear that', 'Sending hugs 🤗', 'Here for you', 'That sucks', 'You\'ll get through this', 'I\'m here']
        },
        anger: {
            keywords: ['angry', 'mad', 'furious', 'pissed', 'annoyed', 'frustrated', 'irritated'],
            responses: ['That\'s frustrating!', 'I get it', 'Totally understandable', 'Let it out', 'That would annoy me too', 'Vent away']
        },
        anxiety: {
            keywords: ['anxious', 'nervous', 'worried', 'stressed', 'panic', 'overwhelmed', 'scared'],
            responses: ['You got this!', 'Take deep breaths', 'It\'ll be okay', 'I believe in you', 'One step at a time', 'Breathe']
        },
        love_affection: {
            keywords: ['love you', 'miss you', 'thinking of you', 'care about you', 'adore you'],
            responses: ['Love you too! ❤️', 'Miss you more!', 'Aww! 💕', 'Right back at you!', 'You\'re the best!', 'Same here! 🥰']
        },

        // 🔹 DAILY LIFE & ROUTINE
        waking_up: {
            keywords: ['just woke up', 'waking up', 'sleepy', 'tired', 'need coffee', 'drowsy'],
            responses: ['Coffee time! ☕', 'Rise and grind!', 'Need that caffeine!', 'Sleepy head!', 'Time to wake up!', 'Get that coffee!']
        },
        work_life: {
            keywords: ['work', 'office', 'job', 'boss', 'meeting', 'deadline', 'colleague', 'project'],
            responses: ['Work life!', 'How\'s the grind?', 'Office vibes', 'Hope it goes well!', 'You got this!', 'Work hard!']
        },
        commuting: {
            keywords: ['traffic', 'commute', 'train', 'bus', 'driving', 'stuck', 'late'],
            responses: ['Traffic sucks!', 'Safe travels!', 'Hope you make it!', 'Commute life!', 'Drive safe!', 'Almost there!']
        },
        food_talk: {
            keywords: ['hungry', 'food', 'eat', 'lunch', 'dinner', 'breakfast', 'cooking', 'recipe'],
            responses: ['I\'m hungry too!', 'What\'s for dinner?', 'Food sounds good!', 'Share the recipe!', 'Yummy!', 'Making me hungry!']
        },
        shopping: {
            keywords: ['shopping', 'store', 'mall', 'buying', 'purchase', 'sale', 'deal', 'discount'],
            responses: ['Good deal?', 'Shopping spree!', 'Love a good sale!', 'Retail therapy!', 'What did you get?', 'Nice find!']
        },

        // 🔹 HEALTH & WELLNESS
        feeling_sick: {
            keywords: ['sick', 'ill', 'fever', 'cold', 'flu', 'headache', 'pain', 'doctor'],
            responses: ['Feel better soon!', 'Take care! 🤒', 'Rest up!', 'Get well!', 'Drink fluids!', 'Hope you recover quickly!']
        },
        exercise_fitness: {
            keywords: ['gym', 'workout', 'exercise', 'fitness', 'running', 'yoga', 'training'],
            responses: ['Get those gains!', 'Fitness goals!', 'You\'re crushing it!', 'Keep it up!', 'Workout warrior!', 'Stay strong!']
        },
        mental_health: {
            keywords: ['therapy', 'counseling', 'mental health', 'self care', 'meditation', 'mindfulness'],
            responses: ['Self care is important', 'Good for you!', 'Mental health matters', 'Take care of yourself', 'Proud of you', 'You matter']
        },

        // 🔹 RELATIONSHIPS & SOCIAL
        dating: {
            keywords: ['date', 'dating', 'boyfriend', 'girlfriend', 'crush', 'tinder', 'match'],
            responses: ['How did it go?', 'Exciting!', 'Tell me more!', 'Good luck!', 'Hope it goes well!', 'Dating life!']
        },
        breakup: {
            keywords: ['breakup', 'broke up', 'ex', 'single', 'relationship over', 'dumped'],
            responses: ['I\'m sorry 💔', 'You deserve better', 'Here for you', 'Their loss!', 'Time to heal', 'You\'ll be okay']
        },
        friendship: {
            keywords: ['friend', 'bestie', 'bff', 'friendship', 'hanging out', 'catch up'],
            responses: ['Friends are the best!', 'Love good friends!', 'Friendship goals!', 'Have fun!', 'Enjoy!', 'Good times!']
        },
        family_time: {
            keywords: ['family', 'parents', 'mom', 'dad', 'siblings', 'relatives', 'reunion'],
            responses: ['Family time!', 'How are they?', 'Family is everything', 'Give them my love!', 'Enjoy the time!', 'Family vibes!']
        },

        // 🔹 ENTERTAINMENT & MEDIA
        movies_tv: {
            keywords: ['movie', 'film', 'netflix', 'tv show', 'series', 'episode', 'binge', 'cinema'],
            responses: ['What\'s it about?', 'Good choice!', 'Love that show!', 'Binge mode!', 'Movie night!', 'Is it good?']
        },
        music: {
            keywords: ['music', 'song', 'artist', 'album', 'concert', 'spotify', 'playlist'],
            responses: ['Great taste!', 'Love that song!', 'Music vibes!', 'Send me the link!', 'Good artist!', 'Concert sounds fun!']
        },
        gaming: {
            keywords: ['game', 'gaming', 'xbox', 'playstation', 'pc', 'mobile game', 'level'],
            responses: ['Gaming time!', 'What level?', 'Good game!', 'Let\'s play!', 'Gaming session!', 'Nice!']
        },
        social_media: {
            keywords: ['instagram', 'facebook', 'tiktok', 'twitter', 'post', 'story', 'viral', 'likes'],
            responses: ['Saw your post!', 'Going viral!', 'Social media life!', 'Great content!', 'Love your posts!', 'Nice story!']
        },

        // 🔹 WEATHER & SEASONS
        hot_weather: {
            keywords: ['hot', 'heat', 'summer', 'sunny', 'warm', 'sweating', 'ac'],
            responses: ['So hot!', 'Summer vibes!', 'Stay cool!', 'Need AC!', 'Hot day!', 'Drink water!']
        },
        cold_weather: {
            keywords: ['cold', 'winter', 'snow', 'freezing', 'chilly', 'jacket'],
            responses: ['Brrr!', 'Stay warm!', 'Winter vibes!', 'Bundle up!', 'Cold day!', 'Hot chocolate time!']
        },
        rain: {
            keywords: ['rain', 'raining', 'wet', 'umbrella', 'storm', 'drizzle'],
            responses: ['Rainy day!', 'Stay dry!', 'Love the rain!', 'Cozy weather!', 'Umbrella time!', 'Perfect nap weather!']
        },

        // 🔹 TRAVEL & PLACES
        vacation: {
            keywords: ['vacation', 'holiday', 'trip', 'travel', 'beach', 'mountains', 'adventure'],
            responses: ['Have fun!', 'Enjoy your trip!', 'Vacation vibes!', 'Safe travels!', 'Take pics!', 'Jealous!']
        },
        home: {
            keywords: ['home', 'house', 'apartment', 'room', 'cozy', 'comfortable'],
            responses: ['Home sweet home!', 'Cozy vibes!', 'Nothing like home!', 'Relax time!', 'Comfort zone!', 'Home is best!']
        },

        // 🔹 SCHOOL & EDUCATION
        studying: {
            keywords: ['study', 'exam', 'test', 'homework', 'assignment', 'school', 'college', 'university'],
            responses: ['Good luck studying!', 'You got this!', 'Study hard!', 'Almost done!', 'Keep going!', 'Education first!']
        },
        graduation: {
            keywords: ['graduation', 'degree', 'diploma', 'graduate', 'ceremony'],
            responses: ['Congratulations! 🎓', 'So proud!', 'You did it!', 'Amazing achievement!', 'Well deserved!', 'Celebration time!']
        },

        // 🔹 TECHNOLOGY & DIGITAL
        phone_tech: {
            keywords: ['phone', 'iphone', 'android', 'app', 'update', 'battery', 'wifi'],
            responses: ['Tech life!', 'Need that update!', 'Phone troubles?', 'Technology!', 'Digital world!', 'Modern problems!']
        },
        internet: {
            keywords: ['internet', 'wifi', 'connection', 'online', 'website', 'browser'],
            responses: ['Internet issues?', 'Stay connected!', 'Online life!', 'Digital age!', 'Connection problems!', 'Tech troubles!']
        },

        // 🔹 MONEY & FINANCES
        money_talk: {
            keywords: ['money', 'cash', 'broke', 'expensive', 'cheap', 'budget', 'salary', 'pay'],
            responses: ['Money matters!', 'Budget life!', 'I feel you!', 'Expensive times!', 'Save up!', 'Financial goals!']
        },

        // 🔹 HOBBIES & INTERESTS
        reading: {
            keywords: ['book', 'reading', 'novel', 'author', 'library', 'chapter'],
            responses: ['Good book?', 'Love reading!', 'What genre?', 'Bookworm!', 'Page turner?', 'Great choice!']
        },
        cooking: {
            keywords: ['cooking', 'recipe', 'kitchen', 'chef', 'baking', 'ingredients'],
            responses: ['Smells good!', 'Chef mode!', 'Share the recipe!', 'Cooking skills!', 'Yummy!', 'Kitchen magic!']
        },
        art_creativity: {
            keywords: ['art', 'drawing', 'painting', 'creative', 'design', 'craft'],
            responses: ['So creative!', 'Artistic!', 'Love it!', 'Talented!', 'Beautiful work!', 'Creative genius!']
        },

        // 🔹 TRANSPORTATION
        car_driving: {
            keywords: ['car', 'driving', 'license', 'parking', 'gas', 'mechanic'],
            responses: ['Drive safe!', 'Car troubles?', 'Road trip!', 'Traffic life!', 'Parking struggles!', 'Car life!']
        },

        // 🔹 SPECIAL OCCASIONS
        birthday: {
            keywords: ['birthday', 'bday', 'cake', 'party', 'celebration', 'age'],
            responses: ['Happy Birthday! 🎉', 'Party time!', 'Cake day!', 'Celebrate!', 'Many happy returns!', 'Birthday vibes!']
        },
        anniversary: {
            keywords: ['anniversary', 'years together', 'milestone', 'special day'],
            responses: ['Happy Anniversary!', 'Congratulations!', 'Milestone!', 'Special day!', 'Cheers!', 'Amazing!']
        },
        holidays: {
            keywords: ['christmas', 'new year', 'thanksgiving', 'halloween', 'valentine'],
            responses: ['Happy Holidays!', 'Festive time!', 'Holiday spirit!', 'Celebration mode!', 'Enjoy!', 'Holiday vibes!']
        },

        // 🔹 SPORTS & FITNESS
        sports: {
            keywords: ['football', 'basketball', 'soccer', 'tennis', 'baseball', 'game', 'match'],
            responses: ['Go team!', 'Good game!', 'Sports fan!', 'Who\'s winning?', 'Game on!', 'Athletic!']
        },

        // 🔹 PETS & ANIMALS
        pets: {
            keywords: ['dog', 'cat', 'pet', 'puppy', 'kitten', 'animal', 'cute'],
            responses: ['So cute!', 'Pet love!', 'Adorable!', 'Fur baby!', 'Sweet pet!', 'Animal lover!']
        },

        // 🔹 SLEEP & REST
        tired: {
            keywords: ['tired', 'sleepy', 'exhausted', 'nap', 'rest', 'sleep'],
            responses: ['Get some rest!', 'Nap time!', 'Sleep well!', 'You need rest!', 'Recharge!', 'Sweet dreams!']
        },

        // 🔹 QUESTIONS & RESPONSES
        availability: {
            keywords: ['free', 'available', 'busy', 'schedule', 'time'],
            responses: ['Yeah, I\'m free!', 'Bit busy right now', 'What\'s up?', 'Sure, what time?', 'I have some time']
        },
        questions: {
            keywords: ['?', 'what', 'how', 'when', 'where', 'why', 'who'],
            responses: ['Good question!', 'Let me think...', 'Not sure tbh', 'What do you think?', 'Hmm...']
        },
        general_chat: {
            keywords: ['up', 'doing', 'going', 'happening', 'new'],
            responses: ['Not much!', 'Just chilling', 'Same old', 'Nothing special', 'You?']
        },

        // 🔹 AGREEMENT & DISAGREEMENT
        agreement: {
            keywords: ['yes', 'yeah', 'totally', 'exactly', 'absolutely', 'definitely', 'for sure'],
            responses: ['Right?!', 'Exactly!', 'I know right!', 'Totally!', 'Same!', 'Absolutely!']
        },
        disagreement: {
            keywords: ['no', 'nope', 'disagree', 'wrong', 'not really', 'nah'],
            responses: ['Fair point', 'I see', 'Different views', 'Interesting', 'Maybe not', 'Could be']
        },

        // 🔹 GRATITUDE & APPRECIATION
        thanks: {
            keywords: ['thank you', 'thanks', 'appreciate', 'grateful', 'thx'],
            responses: ['No problem!', 'Anytime!', 'You got it!', 'Happy to help!', 'Of course!', 'Welcome!']
        },

        // 🔹 APOLOGIES
        apology: {
            keywords: ['sorry', 'apologize', 'my fault', 'forgive me', 'mistake'],
            responses: ['It\'s okay!', 'No worries!', 'All good!', 'Don\'t worry about it', 'Happens to everyone', 'We\'re good!']
        },

        // 🔹 COMPLIMENTS & PRAISE
        compliments: {
            keywords: ['beautiful', 'handsome', 'smart', 'amazing', 'awesome', 'great job'],
            responses: ['Thank you! 😊', 'You\'re too kind!', 'That means a lot!', 'Right back at you!', 'Aww thanks!']
        },

        // 🔹 FAREWELLS
        goodbye: {
            keywords: ['bye', 'see you', 'talk later', 'gotta go', 'leaving'],
            responses: ['See ya!', 'Later!', 'Talk soon!', 'Bye!', 'Take care!', 'Until next time!']
        },

        // 🔹 EXCITEMENT & ENTHUSIASM
        excitement: {
            keywords: ['excited', 'pumped', 'can\'t wait', 'thrilled', 'stoked'],
            responses: ['So exciting!', 'I\'m pumped too!', 'Can\'t wait!', 'That\'s awesome!', 'Woohoo!', 'Energy!']
        },

        // 🔹 CONFUSION & UNCERTAINTY
        confusion: {
            keywords: ['confused', 'don\'t understand', 'what do you mean', 'huh', 'unclear'],
            responses: ['Let me explain', 'I get it', 'Confusing stuff', 'Makes sense', 'I see', 'Gotcha']
        },

        // 🔹 SURPRISE & SHOCK
        surprise: {
            keywords: ['wow', 'omg', 'really', 'no way', 'seriously', 'shocking'],
            responses: ['I know right!', 'Unbelievable!', 'So surprising!', 'Plot twist!', 'Mind blown!', 'Crazy!']
        },

        // 🔹 BOREDOM
        boredom: {
            keywords: ['bored', 'boring', 'nothing to do', 'dull', 'monotonous'],
            responses: ['Same here!', 'Let\'s do something!', 'Boredom strikes!', 'Need entertainment!', 'Time for fun!', 'Spice it up!']
        },

        // 🔹 MOTIVATION & ENCOURAGEMENT
        motivation: {
            keywords: ['motivation', 'inspire', 'encourage', 'support', 'believe'],
            responses: ['You got this!', 'Keep going!', 'Don\'t give up!', 'Believe in yourself!', 'You\'re strong!', 'Push through!']
        },

        // 🔹 MEMORIES & NOSTALGIA
        nostalgia: {
            keywords: ['remember', 'old days', 'childhood', 'memories', 'past', 'used to'],
            responses: ['Good times!', 'Sweet memories!', 'Those were the days!', 'Nostalgia hits!', 'Time flies!', 'Remember that!']
        },

        // 🔹 FUTURE PLANS
        future_plans: {
            keywords: ['plan', 'future', 'goal', 'dream', 'hope', 'want to'],
            responses: ['Sounds great!', 'Good plan!', 'Dream big!', 'Go for it!', 'Future looks bright!', 'Make it happen!']
        },

        // 🔹 RANDOM & MISCELLANEOUS
        random_expressions: {
            keywords: ['lol', 'haha', 'funny', 'joke', 'weird', 'random', 'crazy'],
            responses: ['Haha!', 'So funny!', 'LOL!', 'That\'s random!', 'Crazy stuff!', 'Good one!']
        },

        // 🔹 CURRENT EVENTS & NEWS
        news: {
            keywords: ['news', 'current events', 'politics', 'world', 'happening'],
            responses: ['Interesting news!', 'What\'s happening?', 'Current events!', 'Stay informed!', 'World news!', 'Times are changing!']
        },

        // 🔹 FASHION & STYLE
        fashion: {
            keywords: ['outfit', 'clothes', 'fashion', 'style', 'dress', 'shoes'],
            responses: ['Great style!', 'Fashion forward!', 'Love the outfit!', 'Stylish!', 'Looking good!', 'Fashion sense!']
        },

        // 🔹 BEAUTY & SELF-CARE
        beauty: {
            keywords: ['makeup', 'skincare', 'hair', 'beauty', 'salon', 'spa'],
            responses: ['Self care time!', 'Pampering session!', 'Beauty routine!', 'Looking fresh!', 'Glow up!', 'Treat yourself!']
        },

        // 🔹 ADVANCED EMOTIONS & PSYCHOLOGY
        anxiety_specific: {
            keywords: ['panic attack', 'overwhelmed', 'stressed out', 'can\'t breathe', 'heart racing'],
            responses: ['Breathe slowly', 'You\'re safe', 'This will pass', 'Focus on your breathing', 'Ground yourself', 'I\'m here']
        },
        depression_support: {
            keywords: ['depressed', 'hopeless', 'worthless', 'empty', 'dark thoughts'],
            responses: ['You matter', 'This is temporary', 'Please reach out for help', 'You\'re not alone', 'Tomorrow can be better', 'I care about you']
        },
        self_doubt: {
            keywords: ['not good enough', 'imposter syndrome', 'doubt myself', 'failure', 'inadequate'],
            responses: ['You\'re amazing', 'Don\'t be so hard on yourself', 'Everyone feels this way sometimes', 'You\'ve got this', 'Believe in yourself', 'You\'re stronger than you think']
        },
        confidence_boost: {
            keywords: ['confident', 'proud', 'accomplished', 'achieved', 'succeeded'],
            responses: ['You should be proud!', 'That\'s amazing!', 'Confidence looks good on you!', 'You earned it!', 'Keep shining!', 'Inspiring!']
        },
        jealousy: {
            keywords: ['jealous', 'envious', 'wish I had', 'not fair', 'why them'],
            responses: ['I understand that feeling', 'Your time will come', 'Focus on your journey', 'Everyone\'s path is different', 'You have your own gifts', 'Comparison is the thief of joy']
        },
        guilt_shame: {
            keywords: ['guilty', 'ashamed', 'regret', 'should have', 'my fault'],
            responses: ['We all make mistakes', 'Learn and move forward', 'You\'re human', 'Forgive yourself', 'Growth comes from mistakes', 'Don\'t be too hard on yourself']
        },
        relief: {
            keywords: ['relieved', 'finally over', 'weight off shoulders', 'can breathe again'],
            responses: ['What a relief!', 'You must feel so much better!', 'Finally!', 'That\'s a load off!', 'Breathe easy now!', 'So happy for you!']
        },
        frustration: {
            keywords: ['frustrated', 'annoying', 'fed up', 'had enough', 'irritating'],
            responses: ['That\'s so frustrating!', 'I feel your pain', 'Vent it out!', 'Sometimes life is like that', 'Hang in there', 'This too shall pass']
        },

        // 🔹 RELATIONSHIPS - DEEPER LEVELS
        long_distance: {
            keywords: ['long distance', 'miss them', 'far away', 'different cities', 'video call'],
            responses: ['Long distance is tough', 'Love knows no distance', 'Stay strong!', 'Technology helps!', 'Worth the wait!', 'Distance makes hearts grow fonder']
        },
        toxic_relationships: {
            keywords: ['toxic', 'manipulative', 'gaslighting', 'abusive', 'red flags'],
            responses: ['You deserve better', 'Trust your instincts', 'That\'s not okay', 'Please be safe', 'Consider getting help', 'You\'re worth more']
        },
        marriage_talk: {
            keywords: ['marriage', 'wedding', 'engaged', 'proposal', 'spouse'],
            responses: ['Congratulations!', 'So exciting!', 'Wedding bells!', 'Happy for you!', 'Love wins!', 'Beautiful news!']
        },
        divorce_separation: {
            keywords: ['divorce', 'separated', 'splitting up', 'custody', 'ex-spouse'],
            responses: ['I\'m sorry', 'That\'s tough', 'New beginnings', 'You\'ll get through this', 'Take care of yourself', 'Here for you']
        },
        friendship_drama: {
            keywords: ['friend drama', 'backstabbed', 'fake friends', 'betrayed', 'friendship over'],
            responses: ['That hurts', 'True friends wouldn\'t do that', 'You deserve loyal friends', 'Their loss', 'Quality over quantity', 'Real friends are rare']
        },
        making_friends: {
            keywords: ['new friends', 'making friends', 'social anxiety', 'shy', 'lonely'],
            responses: ['Put yourself out there!', 'Be yourself!', 'Join activities you enjoy', 'Friendship takes time', 'You\'re likeable!', 'Start with small talk']
        },
        parenting: {
            keywords: ['kids', 'children', 'parenting', 'mom life', 'dad life', 'baby'],
            responses: ['Parenting is tough!', 'You\'re doing great!', 'Kids are amazing!', 'Enjoy every moment!', 'They grow so fast!', 'Proud parent!']
        },
        pregnancy: {
            keywords: ['pregnant', 'expecting', 'baby on the way', 'due date', 'ultrasound'],
            responses: ['Congratulations!', 'So exciting!', 'Baby news!', 'How wonderful!', 'New life!', 'Blessing!']
        },

        // 🔹 WORK & CAREER - EXPANDED
        job_hunting: {
            keywords: ['job search', 'unemployed', 'looking for work', 'resume', 'job interview'],
            responses: ['Good luck with the search!', 'Something will come up!', 'Keep applying!', 'You\'ll find the right fit!', 'Stay positive!', 'Your skills are valuable!']
        },
        promotion: {
            keywords: ['promotion', 'raise', 'new position', 'career advancement', 'boss offered'],
            responses: ['Congratulations!', 'Well deserved!', 'You earned it!', 'Career goals!', 'Moving up!', 'So proud!']
        },
        workplace_stress: {
            keywords: ['work stress', 'burnout', 'overworked', 'toxic workplace', 'bad boss'],
            responses: ['Work stress is real', 'Take care of yourself', 'Maybe time for a change?', 'Don\'t let work consume you', 'Your health comes first', 'Consider your options']
        },
        retirement: {
            keywords: ['retirement', 'retiring', 'pension', 'golden years', 'done working'],
            responses: ['Enjoy retirement!', 'You\'ve earned it!', 'New chapter!', 'Freedom!', 'Time to relax!', 'Golden years ahead!']
        },
        entrepreneurship: {
            keywords: ['startup', 'business', 'entrepreneur', 'own company', 'self-employed'],
            responses: ['Entrepreneurial spirit!', 'Go for it!', 'Business owner!', 'Take the leap!', 'Innovation!', 'Be your own boss!']
        },
        remote_work: {
            keywords: ['work from home', 'remote work', 'home office', 'zoom meetings', 'virtual'],
            responses: ['Remote life!', 'Home office vibes!', 'Pajama meetings!', 'Work-life balance!', 'No commute!', 'Digital nomad!']
        },
        layoffs: {
            keywords: ['laid off', 'downsizing', 'job cuts', 'redundant', 'company closing'],
            responses: ['I\'m sorry to hear that', 'That\'s tough', 'New opportunities await', 'You\'ll bounce back', 'Their loss', 'Something better is coming']
        },

        // 🔹 EDUCATION - DETAILED
        college_life: {
            keywords: ['college', 'university', 'dorm', 'campus', 'freshman', 'sophomore'],
            responses: ['College life!', 'Enjoy the experience!', 'Study hard, party harder!', 'Best years!', 'Make memories!', 'Learn and grow!']
        },
        finals_week: {
            keywords: ['finals', 'final exams', 'cramming', 'all-nighter', 'study week'],
            responses: ['Finals stress!', 'You got this!', 'Almost done!', 'Push through!', 'Summer\'s coming!', 'One more week!']
        },
        student_loans: {
            keywords: ['student loans', 'tuition', 'college debt', 'financial aid', 'broke student'],
            responses: ['Student debt is real', 'Education is an investment', 'You\'re not alone', 'It\'ll pay off', 'Ramen life!', 'Worth it in the end']
        },
        online_learning: {
            keywords: ['online class', 'e-learning', 'virtual school', 'distance learning', 'zoom class'],
            responses: ['Online learning!', 'Technology in education!', 'Learn from anywhere!', 'New way of learning!', 'Adapt and overcome!', 'Digital classroom!']
        },
        teacher_life: {
            keywords: ['teaching', 'teacher', 'classroom', 'students', 'lesson plans'],
            responses: ['Teachers are heroes!', 'Shaping minds!', 'Important work!', 'Thank you for teaching!', 'Education matters!', 'Making a difference!']
        },

        // 🔹 HEALTH - COMPREHENSIVE
        mental_therapy: {
            keywords: ['therapist', 'counselor', 'therapy session', 'mental health professional'],
            responses: ['Therapy is brave', 'Good for you!', 'Mental health matters', 'Healing journey', 'Self-improvement', 'Taking care of yourself']
        },
        medication: {
            keywords: ['medication', 'pills', 'prescription', 'side effects', 'dosage'],
            responses: ['Hope it helps!', 'Follow doctor\'s orders', 'Health first!', 'Take care!', 'Medicine can help', 'Listen to your body']
        },
        surgery: {
            keywords: ['surgery', 'operation', 'hospital', 'recovery', 'surgeon'],
            responses: ['Wishing you well!', 'Speedy recovery!', 'You\'re in good hands!', 'Healing thoughts!', 'Get well soon!', 'Surgery is scary but you\'re brave!']
        },
        chronic_illness: {
            keywords: ['chronic illness', 'autoimmune', 'disability', 'chronic pain', 'invisible illness'],
            responses: ['You\'re so strong', 'I admire your courage', 'Chronic illness is tough', 'You\'re a warrior', 'Sending strength', 'You\'re not alone']
        },
        addiction_recovery: {
            keywords: ['recovery', 'sober', 'addiction', 'rehab', 'clean'],
            responses: ['So proud of you!', 'Recovery is brave!', 'One day at a time', 'You\'re strong!', 'Keep going!', 'Sobriety is beautiful!']
        },
        weight_loss: {
            keywords: ['weight loss', 'diet', 'lost weight', 'healthy eating', 'transformation'],
            responses: ['Amazing progress!', 'You look great!', 'Healthy lifestyle!', 'Keep it up!', 'Inspiring!', 'Health journey!']
        },
        pregnancy_journey: {
            keywords: ['morning sickness', 'baby bump', 'cravings', 'ultrasound', 'trimester'],
            responses: ['Growing life!', 'Pregnancy glow!', 'Miracle of life!', 'Exciting journey!', 'Baby on board!', 'Beautiful process!']
        },

        // 🔹 TECHNOLOGY - MODERN LIFE
        social_media_detox: {
            keywords: ['social media detox', 'deleted instagram', 'offline', 'digital detox', 'screen time'],
            responses: ['Good for you!', 'Mental health break!', 'Real life is better!', 'Healthy choice!', 'Disconnect to reconnect!', 'Peace of mind!']
        },
        phone_addiction: {
            keywords: ['phone addiction', 'screen time', 'scrolling', 'doom scrolling', 'phone dependency'],
            responses: ['We\'re all guilty!', 'Modern problem!', 'Put the phone down!', 'Real life awaits!', 'Digital wellness!', 'Mindful usage!']
        },
        online_shopping: {
            keywords: ['online shopping', 'amazon cart', 'impulse buying', 'delivery', 'package'],
            responses: ['Online shopping spree!', 'Retail therapy!', 'What did you buy?', 'Delivery day!', 'Shopping addiction!', 'Treat yourself!']
        },
        cryptocurrency: {
            keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'hodl', 'to the moon'],
            responses: ['Crypto life!', 'Diamond hands!', 'To the moon!', 'Blockchain revolution!', 'Digital currency!', 'Future of money!']
        },
        ai_technology: {
            keywords: ['artificial intelligence', 'ai', 'chatgpt', 'machine learning', 'automation'],
            responses: ['AI is fascinating!', 'Future is here!', 'Technology evolution!', 'Robots taking over!', 'Innovation!', 'Sci-fi becoming reality!']
        },
        streaming_services: {
            keywords: ['netflix', 'disney plus', 'hulu', 'amazon prime', 'streaming', 'binge watching'],
            responses: ['Streaming life!', 'What are you watching?', 'Binge mode!', 'Too many choices!', 'Entertainment overload!', 'Couch potato mode!']
        },
        video_calls: {
            keywords: ['zoom', 'facetime', 'video call', 'virtual meeting', 'camera on'],
            responses: ['Video call life!', 'See your face!', 'Technology connecting us!', 'Virtual hangout!', 'Face to face!', 'Digital meeting!']
        },

        // 🔹 FOOD & COOKING - EXPANDED
        cooking_fails: {
            keywords: ['cooking fail', 'burned food', 'kitchen disaster', 'ruined dinner', 'cooking mistake'],
            responses: ['Cooking fails happen!', 'Order takeout!', 'Practice makes perfect!', 'Kitchen disasters!', 'We\'ve all been there!', 'Cooking is hard!']
        },
        baking: {
            keywords: ['baking', 'cookies', 'cake', 'bread', 'oven', 'flour'],
            responses: ['Baking therapy!', 'Smells amazing!', 'Homemade goodness!', 'Baker mode!', 'Sweet treats!', 'Baking skills!']
        },
        diet_trends: {
            keywords: ['keto', 'vegan', 'paleo', 'intermittent fasting', 'plant based', 'gluten free'],
            responses: ['Health journey!', 'Lifestyle change!', 'Good for you!', 'Healthy choices!', 'Diet discipline!', 'Wellness focus!']
        },
        food_delivery: {
            keywords: ['food delivery', 'doordash', 'uber eats', 'takeout', 'delivery driver'],
            responses: ['Delivery life!', 'Modern convenience!', 'Food at your door!', 'Lazy dinner!', 'Support local restaurants!', 'Delivery hero!']
        },
        meal_prep: {
            keywords: ['meal prep', 'batch cooking', 'food prep', 'weekly meals', 'containers'],
            responses: ['Meal prep master!', 'Organized eating!', 'Healthy planning!', 'Future you will thank you!', 'Prep life!', 'Smart eating!']
        },
        food_allergies: {
            keywords: ['food allergy', 'allergic reaction', 'epipen', 'gluten intolerance', 'lactose intolerant'],
            responses: ['Food allergies are serious!', 'Stay safe!', 'Read those labels!', 'Health first!', 'Allergy awareness!', 'Take care!']
        },
        restaurant_reviews: {
            keywords: ['restaurant review', 'yelp', 'food critic', 'dining experience', 'service'],
            responses: ['How was the food?', 'Good service?', 'Worth the money?', 'Food review!', 'Dining experience!', 'Restaurant life!']
        },

        // 🔹 TRAVEL - DETAILED
        solo_travel: {
            keywords: ['solo travel', 'traveling alone', 'backpacking', 'solo trip', 'independent travel'],
            responses: ['Solo travel is brave!', 'Find yourself!', 'Independence!', 'Adventure awaits!', 'Solo journey!', 'Explore freely!']
        },
        travel_anxiety: {
            keywords: ['travel anxiety', 'flight fear', 'scared to fly', 'travel stress', 'motion sickness'],
            responses: ['Travel anxiety is real', 'You\'ll be okay!', 'Breathe through it', 'Safe travels!', 'Focus on the destination!', 'Travel nerves!']
        },
        budget_travel: {
            keywords: ['budget travel', 'backpacker', 'cheap flights', 'hostels', 'travel deals'],
            responses: ['Budget travel smart!', 'Adventure on a dime!', 'Frugal explorer!', 'Money-saving travel!', 'Budget-friendly!', 'Travel hacks!']
        },
        luxury_travel: {
            keywords: ['luxury travel', 'first class', 'five star', 'resort', 'spa vacation'],
            responses: ['Living the dream!', 'Luxury life!', 'Treat yourself!', 'High-end travel!', 'Pampered vacation!', 'VIP treatment!']
        },
        travel_delays: {
            keywords: ['flight delayed', 'airport', 'travel delays', 'missed connection', 'cancelled flight'],
            responses: ['Travel delays suck!', 'Airport life!', 'Travel stress!', 'Hope you make it!', 'Travel chaos!', 'Patience needed!']
        },
        culture_shock: {
            keywords: ['culture shock', 'different culture', 'language barrier', 'cultural differences', 'foreign country'],
            responses: ['Culture shock is real!', 'Embrace the differences!', 'Learning experience!', 'Cultural immersion!', 'Open your mind!', 'Travel broadens horizons!']
        },
        jet_lag: {
            keywords: ['jet lag', 'time difference', 'tired from travel', 'sleep schedule', 'timezone'],
            responses: ['Jet lag is rough!', 'Time to adjust!', 'Sleep when you can!', 'Travel fatigue!', 'Your body will adapt!', 'Rest up!']
        },

        // 🔹 ENTERTAINMENT - DEEPER
        celebrity_gossip: {
            keywords: ['celebrity', 'famous person', 'hollywood', 'red carpet', 'paparazzi'],
            responses: ['Celebrity drama!', 'Hollywood life!', 'Fame and fortune!', 'Star power!', 'Celebrity culture!', 'Gossip time!']
        },
        reality_tv: {
            keywords: ['reality tv', 'bachelor', 'survivor', 'big brother', 'real housewives'],
            responses: ['Reality TV drama!', 'Guilty pleasure!', 'So addictive!', 'Reality show chaos!', 'Drama central!', 'Trashy TV!']
        },
        podcast_life: {
            keywords: ['podcast', 'listening to', 'audio content', 'true crime', 'podcast addict'],
            responses: ['Podcast life!', 'What are you listening to?', 'Audio entertainment!', 'Podcast binge!', 'Learning while listening!', 'Earphone life!']
        },
        book_clubs: {
            keywords: ['book club', 'reading group', 'book discussion', 'literary', 'book recommendation'],
            responses: ['Book club vibes!', 'Literary discussion!', 'Reading community!', 'Book lovers unite!', 'What\'s the book?', 'Intellectual conversation!']
        },
        art_galleries: {
            keywords: ['art gallery', 'museum', 'exhibition', 'artist', 'artwork'],
            responses: ['Art appreciation!', 'Culture vulture!', 'Creative inspiration!', 'Museum day!', 'Art lover!', 'Cultural enrichment!']
        },
        concerts_festivals: {
            keywords: ['concert', 'music festival', 'live music', 'band', 'performer'],
            responses: ['Live music!', 'Concert vibes!', 'Festival life!', 'Music lover!', 'Great show?', 'Live entertainment!']
        },
        theater_shows: {
            keywords: ['theater', 'broadway', 'play', 'musical', 'performance'],
            responses: ['Theater magic!', 'Broadway vibes!', 'Live performance!', 'Cultural experience!', 'Drama and music!', 'Stage presence!']
        },

        // 🔹 SEASONAL & WEATHER - EXPANDED
        spring_vibes: {
            keywords: ['spring', 'flowers blooming', 'allergies', 'fresh air', 'renewal'],
            responses: ['Spring is here!', 'Fresh beginnings!', 'Nature awakening!', 'Allergy season!', 'Renewal time!', 'Blooming beautiful!']
        },
        summer_fun: {
            keywords: ['summer vacation', 'beach day', 'pool party', 'barbecue', 'ice cream'],
            responses: ['Summer vibes!', 'Beach life!', 'Pool day!', 'BBQ time!', 'Ice cream weather!', 'Sunny days!']
        },
        fall_autumn: {
            keywords: ['fall', 'autumn', 'leaves changing', 'pumpkin spice', 'cozy sweaters'],
            responses: ['Fall vibes!', 'Autumn beauty!', 'Cozy season!', 'Pumpkin everything!', 'Sweater weather!', 'Crisp air!']
        },
        winter_blues: {
            keywords: ['winter depression', 'seasonal affective', 'dark days', 'cabin fever', 'winter blues'],
            responses: ['Winter can be tough', 'Seasonal blues are real', 'Light therapy helps', 'Spring will come!', 'Hang in there!', 'Vitamin D time!']
        },
        holiday_stress: {
            keywords: ['holiday stress', 'family gathering', 'gift shopping', 'holiday pressure', 'christmas anxiety'],
            responses: ['Holiday stress is real!', 'Family time can be tough', 'Gift giving pressure!', 'Holidays aren\'t always merry', 'Take care of yourself!', 'It\'ll be over soon!']
        },
        new_year_resolutions: {
            keywords: ['new year resolution', 'fresh start', 'goal setting', 'new me', 'change'],
            responses: ['New year, new you!', 'Fresh start!', 'Goal setting time!', 'Positive changes!', 'You can do it!', 'Resolution power!']
        },

        // 🔹 GENERATIONAL & CULTURAL
        millennial_problems: {
            keywords: ['millennial', 'avocado toast', 'student debt', 'can\'t afford house', 'gig economy'],
            responses: ['Millennial struggles!', 'Avocado toast life!', 'Housing market is crazy!', 'Gig economy reality!', 'Generational challenges!', 'Adulting is hard!']
        },
        gen_z_vibes: {
            keywords: ['gen z', 'tiktok', 'no cap', 'periodt', 'slay', 'vibe check'],
            responses: ['Gen Z energy!', 'TikTok generation!', 'Digital natives!', 'New slang!', 'Youth culture!', 'Fresh perspective!']
        },
        boomer_humor: {
            keywords: ['boomer', 'back in my day', 'kids these days', 'technology confusing', 'old school'],
            responses: ['Boomer wisdom!', 'Old school cool!', 'Different generation!', 'Experience speaks!', 'Classic perspective!', 'Generational gap!']
        },
        cultural_traditions: {
            keywords: ['cultural tradition', 'heritage', 'ancestry', 'customs', 'cultural identity'],
            responses: ['Cultural richness!', 'Heritage pride!', 'Traditions matter!', 'Cultural identity!', 'Ancestral wisdom!', 'Beautiful customs!']
        },
        immigration_experience: {
            keywords: ['immigrant', 'new country', 'cultural adaptation', 'language learning', 'homesick'],
            responses: ['Immigration is brave!', 'New beginnings!', 'Cultural bridge!', 'Adaptation takes time', 'Home is where you make it', 'Courage to start over!']
        },

        // 🔹 LIFESTYLE & HOBBIES - EXPANDED
        minimalism: {
            keywords: ['minimalism', 'decluttering', 'marie kondo', 'simple living', 'less is more'],
            responses: ['Minimalist life!', 'Less clutter, more peace!', 'Simple living!', 'Quality over quantity!', 'Mindful consumption!', 'Declutter therapy!']
        },
        sustainability: {
            keywords: ['sustainable', 'eco-friendly', 'zero waste', 'environment', 'climate change'],
            responses: ['Eco-warrior!', 'Planet first!', 'Sustainable living!', 'Environmental consciousness!', 'Green lifestyle!', 'Earth lover!']
        },
        gardening: {
            keywords: ['gardening', 'plants', 'green thumb', 'growing', 'garden'],
            responses: ['Green thumb!', 'Plant parent!', 'Garden therapy!', 'Growing life!', 'Nature connection!', 'Gardening zen!']
        },
        photography: {
            keywords: ['photography', 'camera', 'photo shoot', 'capturing moments', 'photographer'],
            responses: ['Great shot!', 'Picture perfect!', 'Capturing memories!', 'Photography skills!', 'Artistic eye!', 'Moment frozen!']
        },
        diy_crafts: {
            keywords: ['diy', 'crafts', 'handmade', 'creative project', 'crafting'],
            responses: ['DIY master!', 'Crafty hands!', 'Creative genius!', 'Handmade love!', 'Artistic skills!', 'Craft therapy!']
        },
        collecting: {
            keywords: ['collecting', 'collection', 'collector', 'vintage', 'antique'],
            responses: ['Cool collection!', 'Collector\'s item!', 'Vintage vibes!', 'Treasure hunting!', 'Collector\'s passion!', 'Unique finds!']
        },
        volunteering: {
            keywords: ['volunteer', 'charity', 'giving back', 'community service', 'helping others'],
            responses: ['Giving back!', 'Community hero!', 'Making a difference!', 'Volunteer spirit!', 'Helping hands!', 'Service to others!']
        },

        // 🔹 FINANCIAL & ECONOMIC
        investing: {
            keywords: ['investing', 'stocks', 'portfolio', 'financial planning', 'retirement fund'],
            responses: ['Smart investing!', 'Financial planning!', 'Building wealth!', 'Money working for you!', 'Investment strategy!', 'Financial future!']
        },
        debt_struggles: {
            keywords: ['debt', 'credit card', 'loans', 'financial stress', 'money problems'],
            responses: ['Debt is stressful', 'Financial challenges', 'You\'ll get through this', 'Money stress is real', 'One step at a time', 'Financial recovery possible']
        },
        side_hustle: {
            keywords: ['side hustle', 'extra income', 'gig work', 'freelance', 'passive income'],
            responses: ['Side hustle grind!', 'Extra income!', 'Hustle culture!', 'Multiple streams!', 'Entrepreneurial spirit!', 'Financial independence!']
        },
        homeownership: {
            keywords: ['buying house', 'mortgage', 'real estate', 'property', 'homeowner'],
            responses: ['Homeownership goals!', 'Real estate investment!', 'Property owner!', 'Building equity!', 'American dream!', 'Home sweet home!']
        },
        financial_independence: {
            keywords: ['financial independence', 'fire movement', 'early retirement', 'financial freedom'],
            responses: ['Financial freedom!', 'Independence goals!', 'FIRE movement!', 'Early retirement!', 'Financial liberation!', 'Money freedom!']
        },

        // 🔹 SPIRITUALITY & PHILOSOPHY
        meditation: {
            keywords: ['meditation', 'mindfulness', 'inner peace', 'spiritual practice', 'zen'],
            responses: ['Inner peace!', 'Mindful living!', 'Spiritual journey!', 'Meditation magic!', 'Zen vibes!', 'Soul searching!']
        },
        religion_faith: {
            keywords: ['faith', 'prayer', 'religious', 'spiritual', 'church', 'temple'],
            responses: ['Faith journey!', 'Spiritual path!', 'Religious devotion!', 'Prayer power!', 'Divine connection!', 'Sacred time!']
        },
        life_purpose: {
            keywords: ['life purpose', 'meaning of life', 'existential', 'soul searching', 'calling'],
            responses: ['Deep thoughts!', 'Life\'s big questions!', 'Purpose seeking!', 'Existential journey!', 'Soul calling!', 'Meaning matters!']
        },
        gratitude: {
            keywords: ['grateful', 'thankful', 'blessed', 'appreciation', 'counting blessings'],
            responses: ['Gratitude attitude!', 'Blessed life!', 'Thankful heart!', 'Appreciation mode!', 'Counting blessings!', 'Grateful soul!']
        },
        personal_growth: {
            keywords: ['personal growth', 'self-improvement', 'becoming better', 'evolving', 'transformation'],
            responses: ['Growth mindset!', 'Personal evolution!', 'Self-improvement journey!', 'Becoming your best self!', 'Transformation time!', 'Growing stronger!']
        },

        // 🔹 INTERNET CULTURE & MEMES
        meme_culture: {
            keywords: ['meme', 'viral', 'internet culture', 'trending', 'going viral'],
            responses: ['Meme life!', 'Internet culture!', 'Viral content!', 'Meme magic!', 'Digital humor!', 'Internet famous!']
        },
        social_media_trends: {
            keywords: ['trending', 'hashtag', 'influencer', 'content creator', 'viral video'],
            responses: ['Trending topic!', 'Social media fame!', 'Influencer life!', 'Content creation!', 'Viral moment!', 'Digital celebrity!']
        },
        online_communities: {
            keywords: ['reddit', 'discord', 'online community', 'forum', 'internet friends'],
            responses: ['Online community!', 'Digital friendship!', 'Internet family!', 'Virtual connections!', 'Online tribe!', 'Digital bonds!']
        },
        gaming_culture: {
            keywords: ['esports', 'twitch', 'streaming', 'gamer', 'competitive gaming'],
            responses: ['Gaming culture!', 'Esports life!', 'Streaming world!', 'Gamer community!', 'Digital competition!', 'Gaming passion!']
        },

        // 🔹 PROFESSIONAL INDUSTRIES
        healthcare_workers: {
            keywords: ['nurse', 'doctor', 'hospital shift', 'medical', 'healthcare', 'patient care'],
            responses: ['Healthcare hero!', 'Thank you for your service!', 'Saving lives!', 'Medical warrior!', 'Healthcare dedication!', 'Frontline hero!']
        },
        retail_service: {
            keywords: ['customer service', 'retail', 'cashier', 'dealing with customers', 'service industry'],
            responses: ['Customer service life!', 'Retail warrior!', 'Service with a smile!', 'Customer is king!', 'Retail therapy!', 'Service industry hero!']
        },
        construction_trades: {
            keywords: ['construction', 'electrician', 'plumber', 'contractor', 'building', 'manual labor'],
            responses: ['Building the future!', 'Skilled trades!', 'Hard work!', 'Construction life!', 'Trade skills!', 'Building dreams!']
        },
        creative_industries: {
            keywords: ['artist', 'designer', 'writer', 'musician', 'creative work', 'freelancer'],
            responses: ['Creative genius!', 'Artistic soul!', 'Creative hustle!', 'Art is life!', 'Creative passion!', 'Artistic vision!']
        },
        law_enforcement: {
            keywords: ['police', 'officer', 'law enforcement', 'security', 'protect and serve'],
            responses: ['Stay safe out there!', 'Protect and serve!', 'Law enforcement!', 'Community safety!', 'Service and protection!', 'Badge of honor!']
        },
        food_industry: {
            keywords: ['chef', 'restaurant', 'kitchen', 'food service', 'culinary', 'cooking professionally'],
            responses: ['Chef life!', 'Culinary artist!', 'Kitchen warrior!', 'Food passion!', 'Culinary skills!', 'Restaurant hustle!']
        },

        // 🔹 LIFE EVENTS & MILESTONES
        first_job: {
            keywords: ['first job', 'new job', 'starting work', 'career beginning', 'entry level'],
            responses: ['Congratulations on the new job!', 'Career journey begins!', 'First step!', 'New chapter!', 'Work life starts!', 'Professional growth!']
        },
        moving_homes: {
            keywords: ['moving', 'new house', 'relocating', 'packing', 'new city', 'change of address'],
            responses: ['Moving day!', 'New beginnings!', 'Fresh start!', 'Home sweet home!', 'Big move!', 'New adventure!']
        },
        milestone_birthdays: {
            keywords: ['30th birthday', '40th birthday', '50th birthday', 'milestone birthday', 'big birthday'],
            responses: ['Milestone birthday!', 'Age is just a number!', 'Celebrate big!', 'Life milestone!', 'Wisdom with age!', 'Birthday milestone!']
        },
        life_changes: {
            keywords: ['life change', 'major decision', 'turning point', 'crossroads', 'big choice'],
            responses: ['Life changes!', 'Big decisions!', 'Crossroads moment!', 'Change is good!', 'New direction!', 'Life pivot!']
        },
        achievements: {
            keywords: ['achievement', 'accomplishment', 'goal reached', 'success', 'milestone reached'],
            responses: ['Amazing achievement!', 'Goal crusher!', 'Success story!', 'Well deserved!', 'Proud moment!', 'Achievement unlocked!']
        },

        // 🔹 MODERN SLANG & EXPRESSIONS
        gen_alpha_slang: {
            keywords: ['sigma', 'rizz', 'ohio', 'skibidi', 'gyat', 'fanum tax'],
            responses: ['That\'s so sigma!', 'Rizz master!', 'Ohio vibes!', 'Skibidi energy!', 'New gen slang!', 'Youth language!']
        },
        internet_slang: {
            keywords: ['slay', 'periodt', 'no cap', 'bet', 'fr fr', 'bussin'],
            responses: ['Slay queen!', 'Periodt!', 'No cap!', 'Bet!', 'Fr fr!', 'That\'s bussin!']
        },
        reaction_expressions: {
            keywords: ['oop', 'tea', 'shade', 'cancelled', 'iconic', 'legend'],
            responses: ['Oop!', 'Spill the tea!', 'Throwing shade!', 'Iconic moment!', 'Legend status!', 'That\'s the tea!']
        },
        social_media_language: {
            keywords: ['stan', 'ship', 'fangirl', 'fanboy', 'bias', 'ult'],
            responses: ['Stan forever!', 'I ship it!', 'Fangirl mode!', 'Bias wrecker!', 'Ultimate bias!', 'Stan culture!']
        },

        // 🔹 GLOBAL CULTURES & LANGUAGES
        spanish_expressions: {
            keywords: ['hola', 'gracias', 'por favor', 'buenos dias', 'buenas noches'],
            responses: ['¡Hola!', '¡Gracias!', '¡De nada!', '¡Buenos días!', '¡Buenas noches!', '¡Qué tal!']
        },
        french_expressions: {
            keywords: ['bonjour', 'merci', 'au revoir', 'comment allez-vous', 'bonsoir'],
            responses: ['Bonjour!', 'Merci beaucoup!', 'Au revoir!', 'Très bien!', 'Bonsoir!', 'C\'est la vie!']
        },
        cultural_celebrations: {
            keywords: ['diwali', 'eid', 'chinese new year', 'hanukkah', 'kwanzaa'],
            responses: ['Happy Diwali!', 'Eid Mubarak!', 'Happy New Year!', 'Happy Hanukkah!', 'Happy Kwanzaa!', 'Cultural celebration!']
        },
        international_food: {
            keywords: ['sushi', 'tacos', 'pasta', 'curry', 'dim sum', 'ramen'],
            responses: ['Love sushi!', 'Taco Tuesday!', 'Pasta perfection!', 'Curry cravings!', 'Dim sum delight!', 'Ramen life!']
        },

        // 🔹 COMPREHENSIVE DAILY INTERACTIONS
        morning_routine: {
            keywords: ['morning routine', 'getting ready', 'shower', 'breakfast', 'commute prep'],
            responses: ['Morning routine!', 'Getting ready!', 'Start the day right!', 'Morning prep!', 'Rise and grind!', 'Daily routine!']
        },
        evening_routine: {
            keywords: ['evening routine', 'winding down', 'bedtime', 'relaxing', 'end of day'],
            responses: ['Evening routine!', 'Winding down!', 'Relax time!', 'End of day!', 'Time to unwind!', 'Evening vibes!']
        },
        weekend_plans: {
            keywords: ['weekend plans', 'saturday', 'sunday', 'weekend vibes', 'days off'],
            responses: ['Weekend plans!', 'Saturday vibes!', 'Sunday funday!', 'Weekend mode!', 'Days off!', 'Weekend warrior!']
        },
        monday_blues: {
            keywords: ['monday blues', 'back to work', 'monday morning', 'start of week', 'monday motivation'],
            responses: ['Monday blues!', 'Back to the grind!', 'Monday motivation!', 'Start of the week!', 'Monday mood!', 'New week energy!']
        },
        friday_feeling: {
            keywords: ['friday feeling', 'tgif', 'end of week', 'friday vibes', 'weekend incoming'],
            responses: ['TGIF!', 'Friday feeling!', 'Weekend incoming!', 'Friday vibes!', 'End of week!', 'Friday energy!']
        },
        procrastination: {
            keywords: ['procrastinating', 'putting off', 'avoiding work', 'distracted', 'time wasting'],
            responses: ['Procrastination nation!', 'We\'ve all been there!', 'Time to focus!', 'Distraction mode!', 'Get back to work!', 'Productivity later!']
        },
        productivity: {
            keywords: ['productive', 'getting things done', 'focused', 'in the zone', 'workflow'],
            responses: ['Productivity mode!', 'Getting things done!', 'In the zone!', 'Focused energy!', 'Workflow master!', 'Productive vibes!']
        },
        time_management: {
            keywords: ['time management', 'schedule', 'calendar', 'planning', 'organized'],
            responses: ['Time management!', 'Schedule master!', 'Planning ahead!', 'Organized life!', 'Time is precious!', 'Calendar queen!']
        },
        multitasking: {
            keywords: ['multitasking', 'juggling', 'busy', 'many things', 'overwhelmed'],
            responses: ['Multitasking master!', 'Juggling life!', 'Busy bee!', 'So much to do!', 'Life juggler!', 'Plate spinning!']
        },
        self_care_reminders: {
            keywords: ['self care', 'take a break', 'rest', 'recharge', 'me time'],
            responses: ['Self care time!', 'Take a break!', 'Rest and recharge!', 'Me time!', 'Self care Sunday!', 'You deserve rest!']
        },
        goal_setting: {
            keywords: ['goals', 'resolutions', 'aspirations', 'dreams', 'ambitions'],
            responses: ['Goal setting!', 'Dream big!', 'Aspirations!', 'Ambition mode!', 'Goals matter!', 'Dream chaser!']
        },
        habit_building: {
            keywords: ['habit', 'routine', 'consistency', 'daily practice', 'building habits'],
            responses: ['Habit building!', 'Consistency is key!', 'Daily practice!', 'Routine master!', 'Habit formation!', 'Small steps!']
        },
        life_balance: {
            keywords: ['work life balance', 'balance', 'priorities', 'juggling life', 'finding balance'],
            responses: ['Life balance!', 'Work-life balance!', 'Priorities matter!', 'Finding balance!', 'Life juggling!', 'Balance is key!']
        },
        stress_management: {
            keywords: ['stress management', 'coping', 'dealing with stress', 'pressure', 'overwhelm'],
            responses: ['Stress management!', 'Coping strategies!', 'Dealing with pressure!', 'Stress relief!', 'You got this!', 'Breathe through it!']
        },
        decision_making: {
            keywords: ['decisions', 'choices', 'dilemma', 'options', 'deciding'],
            responses: ['Tough decisions!', 'So many choices!', 'Decision time!', 'Weighing options!', 'Choice overload!', 'Trust your gut!']
        },
        problem_solving: {
            keywords: ['problem solving', 'figuring out', 'solution', 'troubleshooting', 'fixing'],
            responses: ['Problem solving!', 'Figuring it out!', 'Solution finder!', 'Troubleshooting mode!', 'Fix it!', 'Problem solver!']
        },
        learning_new_things: {
            keywords: ['learning', 'new skill', 'studying', 'education', 'knowledge'],
            responses: ['Learning mode!', 'New skills!', 'Knowledge seeker!', 'Education matters!', 'Always learning!', 'Skill building!']
        },
        creative_blocks: {
            keywords: ['creative block', 'stuck', 'no inspiration', 'writer\'s block', 'creative drought'],
            responses: ['Creative block!', 'We\'ve all been there!', 'Inspiration will come!', 'Creative drought!', 'Take a break!', 'Creativity flows!']
        },
        inspiration_moments: {
            keywords: ['inspired', 'motivation', 'lightbulb moment', 'eureka', 'breakthrough'],
            responses: ['Inspiration strikes!', 'Lightbulb moment!', 'Eureka!', 'Breakthrough!', 'Motivated!', 'Creative spark!']
        },
        comfort_zone: {
            keywords: ['comfort zone', 'stepping out', 'taking risks', 'new experiences', 'challenging yourself'],
            responses: ['Comfort zone exit!', 'Taking risks!', 'New experiences!', 'Challenge accepted!', 'Growth zone!', 'Brave move!']
        },
        life_lessons: {
            keywords: ['life lesson', 'learning experience', 'wisdom', 'growth', 'maturity'],
            responses: ['Life lessons!', 'Learning experience!', 'Wisdom gained!', 'Personal growth!', 'Maturity moment!', 'Life teaches!']
        }
    };

    const analyzeMessage = (message) => {
        if (!message || !message.content) return [];

        const content = message.content.toLowerCase();
        const matchedSuggestions = [];

        // Check each pattern
        for (const [category, pattern] of Object.entries(patterns)) {
            const hasMatch = pattern.keywords.some(keyword =>
                content.includes(keyword.toLowerCase())
            );

            if (hasMatch) {
                // Add all responses from this category
                matchedSuggestions.push(...pattern.responses);
            }
        }

        // Remove duplicates and limit to 3 suggestions
        const uniqueSuggestions = [...new Set(matchedSuggestions)];
        return uniqueSuggestions.slice(0, 3);
    };

    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];

            if (lastMessage && lastMessage.content) {
                const isFromOtherUser = lastMessage.sender && currentUser &&
                    lastMessage.sender._id !== currentUser._id;

                if (isFromOtherUser) {
                    // Show suggestions for any new received message
                    if (lastMessage._id !== lastReceivedMessageId) {
                        const newSuggestions = analyzeMessage(lastMessage);

                        if (newSuggestions.length > 0) {
                            setSuggestions(newSuggestions);
                            setShowSuggestions(true);
                            setLastReceivedMessageId(lastMessage._id);
                            setUserHasReplied(false);
                        }
                    }
                } else if (lastMessage.sender && currentUser && lastMessage.sender._id === currentUser._id) {
                    // User sent a message, hide suggestions
                    setShowSuggestions(false);
                    setUserHasReplied(true);
                }
            }
        }
    }, [messages, currentUser]);

    const handleSuggestionClick = (suggestion) => {
        onSuggestionClick(suggestion);
        setShowSuggestions(false);
        setUserHasReplied(true);
    };

    if (!isVisible || !showSuggestions || suggestions.length === 0) {
        return null;
    }

    return (
        <Box
            mb={2}
            p={2}
            bg={colorMode === "light" ? "gray.50" : "gray.700"}
            borderRadius="md"
            border="1px solid"
            borderColor={colorMode === "light" ? "gray.200" : "gray.600"}
        >
            <HStack spacing={2} wrap="wrap">
                {suggestions.map((suggestion, index) => (
                    <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        fontSize="xs"
                        px={3}
                        py={1}
                        h="auto"
                        minH="28px"
                        borderRadius="full"
                        onClick={() => handleSuggestionClick(suggestion)}
                        _hover={{
                            bg: colorMode === "light" ? "blue.50" : "blue.900",
                            borderColor: colorMode === "light" ? "blue.300" : "blue.500"
                        }}
                    >
                        {suggestion}
                    </Button>
                ))}
            </HStack>
        </Box>
    );
};

export default SmartReplySuggestions;
