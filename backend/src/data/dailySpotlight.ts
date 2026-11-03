export interface DailyVerse {
  reference: string;
  text: string;
  translation: string;
  topic: string;
}

export interface DailyDevotional {
  title: string;
  author: string;
  readTime: string;
  teaser: string;
  fullText: string;
  reflectionPrompt: string;
  prayer: string;
}

export interface DailySpotlightItem {
  dayNumber: number;
  theme: string;
  verse: DailyVerse;
  devotional: DailyDevotional;
}

export const DAILY_SPOTLIGHT_COLLECTION: DailySpotlightItem[] = [
  {
    dayNumber: 1,
    theme: 'God’s Sovereign Plans',
    verse: {
      reference: 'Jeremiah 29:11',
      text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
      translation: 'NIV',
      topic: 'Hope & Purpose',
    },
    devotional: {
      title: 'Trusting God in the Waiting Room of Life',
      author: 'Pastor Emmanuel',
      readTime: '3 min read',
      teaser: 'Waiting on God is never wasted time. He is molding your character while preparing your breakthrough...',
      fullText: 'Waiting on God is never wasted time. He is molding your character while preparing your breakthrough. In Psalm 27:14, David writes: "Wait for the Lord; be strong and take heart and wait for the Lord." When we rush ahead of God\'s timing, we often create complications. But when we wait patiently in prayer, God produces endurance, spiritual authority, and peace in our hearts. Whatever promise you are waiting on today, anchor your heart in His sovereign goodness.',
      reflectionPrompt: 'Where are you tempted to rush ahead of God today, and how can you surrender that timeline to Him?',
      prayer: 'Lord, give me patience to trust Your timing. I know Your plans for me are good and full of eternal purpose. Amen.',
    },
  },
  {
    dayNumber: 2,
    theme: 'Strength in Weakness',
    verse: {
      reference: 'Isaiah 40:31',
      text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
      translation: 'NIV',
      topic: 'Endurance',
    },
    devotional: {
      title: 'Soaring Above Life’s Storms',
      author: 'Charles Spurgeon',
      readTime: '3 min read',
      teaser: 'Eagles do not escape the storm; they lock their wings and use the thermal updrafts to soar higher...',
      fullText: 'Eagles do not escape the storm; they lock their wings and use the turbulent updrafts to lift them above the dark clouds. In our spiritual walk, human willpower quickly runs dry, but the Holy Spirit offers an inexhaustible reservoir of supernatural stamina. When fatigue whispers that you cannot take another step, look up. God does not merely give you strength; He becomes your strength.',
      reflectionPrompt: 'Are you relying on your own stamina or drawing from God’s unfailing Spirit today?',
      prayer: 'Heavenly Father, when my energy is spent, renew my soul. Teach me to wait upon You and soar above every anxious thought. Amen.',
    },
  },
  {
    dayNumber: 3,
    theme: 'Overcoming Anxiety with Peace',
    verse: {
      reference: 'Philippians 4:6-7',
      text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
      translation: 'NIV',
      topic: 'Inner Peace',
    },
    devotional: {
      title: 'The Fortress of God’s Peace',
      author: 'A.W. Tozer',
      readTime: '4 min read',
      teaser: 'The peace of God is not the absence of trouble; it is the confident presence of our Almighty King...',
      fullText: 'The peace of God is not the absence of trouble; it is the confident presence of our Almighty King. Paul wrote these words while chained in a Roman prison, showing that divine peace does not depend on comfortable external circumstances. When worry knocks at the door of your mind, hand every anxious thought over to Jesus through specific, grateful prayer. His peace will stand guard like an impenetrable garrison around your heart.',
      reflectionPrompt: 'What specific worry can you trade for God\'s peace right now through thanksgiving?',
      prayer: 'Lord Jesus, I cast all my cares at Your feet. Guard my thoughts with Your peace that surpasses human understanding. Amen.',
    },
  },
  {
    dayNumber: 4,
    theme: 'Walking by Faith, Not by Sight',
    verse: {
      reference: 'Proverbs 3:5-6',
      text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
      translation: 'NIV',
      topic: 'Guidance & Wisdom',
    },
    devotional: {
      title: 'Relinquishing the Steering Wheel',
      author: 'Corrie ten Boom',
      readTime: '3 min read',
      teaser: 'Never be afraid to trust an unknown future to a known God...',
      fullText: 'Human reason often demands to see the full staircase before taking the first step. But God calls us to walk by faith, trusting His steady hand in the fog. Leaning on our own understanding is like leaning on a broken reed. When we acknowledge Him in our finances, our family decisions, and our private aspirations, He clears the road and aligns our steps with His eternal purpose.',
      reflectionPrompt: 'In which area of your life are you leaning on your own logic instead of seeking God’s guidance?',
      prayer: 'Father, I surrender my desire to control every outcome. Lead me in Your righteousness and direct my footsteps. Amen.',
    },
  },
  {
    dayNumber: 5,
    theme: 'Unconditional Love & Adoption',
    verse: {
      reference: 'Romans 8:38-39',
      text: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers... will be able to separate us from the love of God that is in Christ Jesus our Lord.',
      translation: 'NIV',
      topic: 'God\'s Love',
    },
    devotional: {
      title: 'The Unbreakable Anchor of Grace',
      author: 'C.S. Lewis',
      readTime: '4 min read',
      teaser: 'God’s love for you is not based on your performance, but on the finished sacrifice of Christ...',
      fullText: 'Feelings can fluctuate with the morning weather, but God’s covenant love is set in stone. Paul exhausts the vocabulary of creation to demonstrate that nothing in heaven, on earth, or in the spiritual realm can sever the bond between Christ and His redeemed children. You are permanently loved, completely forgiven, and eternally secure in the palm of His hand.',
      reflectionPrompt: 'How does knowing God’s love is unbreakable change how you face today’s challenges?',
      prayer: 'Lord Jesus, thank You for loving me with an everlasting love. Let Your grace cast out every fear of rejection. Amen.',
    },
  },
  {
    dayNumber: 6,
    theme: 'New Mercies Every Morning',
    verse: {
      reference: 'Lamentations 3:22-23',
      text: 'Because of the Lord’s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
      translation: 'NIV',
      topic: 'Mercy & Renewal',
    },
    devotional: {
      title: 'A Fresh Slate with Every Sunrise',
      author: 'Pastor David M.',
      readTime: '3 min read',
      teaser: 'Yesterday’s mistakes do not disqualify you from today’s abundant grace...',
      fullText: 'Jeremiah wrote Lamentations amidst the smoking ruins of Jerusalem, yet in the darkest valley, he lifted his eyes to God’s unending faithfulness. Every sunrise is heaven’s proclamation that God’s mercies have been restocked. You do not have to live under the shadow of past regrets. Receive His fresh pardon, breathe in His Holy Spirit, and step boldly into today with renewed hope.',
      reflectionPrompt: 'What yesterday burden do you need to leave behind to step into today’s fresh mercy?',
      prayer: 'Faithful God, thank You for new mercies today. Cleanse my heart and fill me with fresh zeal to serve You. Amen.',
    },
  },
  {
    dayNumber: 7,
    theme: 'The Good Shepherd’s Care',
    verse: {
      reference: 'Psalm 23:1-3',
      text: 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
      translation: 'NIV',
      topic: 'Rest & Provision',
    },
    devotional: {
      title: 'Resting in the Shepherd’s Shadow',
      author: 'Matthew Henry',
      readTime: '3 min read',
      teaser: 'Sheep can only rest when they know their shepherd is vigilant and near...',
      fullText: 'In our fast-paced culture of hustle and exhaustion, the Shepherd calls His flock to rest. Notice that David says "He makes me lie down" — sometimes God gently halts our busy striving so our souls can be restored. When we realize the Lord is our Shepherd, the constant itch of wanting more fades into deep gratitude for His daily provision and tender guidance.',
      reflectionPrompt: 'How can you pause today to let the Good Shepherd refresh your spirit in quiet waters?',
      prayer: 'Lord Jesus, You are my Shepherd. Lead me away from frantic striving and restore my soul with Your presence. Amen.',
    },
  },
  {
    dayNumber: 8,
    theme: 'God’s Word as a Living Lamp',
    verse: {
      reference: 'Psalm 119:105',
      text: 'Your word is a lamp for my feet, a light on my path.',
      translation: 'NIV',
      topic: 'Scripture Guidance',
    },
    devotional: {
      title: 'Illuminating the Next Step',
      author: 'John Wesley',
      readTime: '3 min read',
      teaser: 'An oil lamp in the ancient world did not light up miles ahead; it illuminated just enough for the next step...',
      fullText: 'Ancient oil lamps cast a warm glow just a few feet forward, requiring the traveler to walk step by step in continuous reliance on the light. God’s Word often works the same way: He gives us daily bread and guidance for the immediate step ahead. When you meditate on Scripture, darkness is dispelled, false philosophies are exposed, and truth lights your way.',
      reflectionPrompt: 'What scripture verse has provided light for your decisions recently?',
      prayer: 'Holy Spirit, open my eyes to behold wonderful things in Your Word. Let Scripture guide every word I speak today. Amen.',
    },
  },
  {
    dayNumber: 9,
    theme: 'The Fruit of the Spirit',
    verse: {
      reference: 'Galatians 5:22-23',
      text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law.',
      translation: 'NIV',
      topic: 'Christian Character',
    },
    devotional: {
      title: 'Cultivating Christlike Character',
      author: 'Andrew Murray',
      readTime: '3 min read',
      teaser: 'Fruit is not manufactured by human effort; it grows naturally when the branch abides in the Vine...',
      fullText: 'A branch does not groan and strain to produce grapes; it simply remains connected to the vine and receives life-giving sap. When you abide in Christ through prayer, worship, and obedience, His Spirit produces supernatural character in you. Where anger once reigned, gentleness blooms. Where worry lived, supernatural joy springs up.',
      reflectionPrompt: 'Which fruit of the Spirit do you sense God wants to cultivate most in your heart this week?',
      prayer: 'Lord Jesus, I abide in You today. Prune away whatever hinders my growth and let Your Spirit bear rich fruit in my life. Amen.',
    },
  },
  {
    dayNumber: 10,
    theme: 'Unshakable Courage',
    verse: {
      reference: 'Joshua 1:9',
      text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
      translation: 'NIV',
      topic: 'Courage & Faith',
    },
    devotional: {
      title: 'Stepping into Your Promised Land',
      author: 'Hudson Taylor',
      readTime: '4 min read',
      teaser: 'Courage is not the absence of fear, but the conviction that God is greater than whatever confronts you...',
      fullText: 'Joshua stood on the banks of the Jordan River facing fortified giants and daunting responsibilities. God did not tell Joshua that the battles would be effortless; He promised something infinitely greater: His unbroken presence. "The Lord your God will be with you wherever you go." When Almighty God walks with you, no obstacle can stand against His redemptive purpose.',
      reflectionPrompt: 'What new frontier or challenge is God calling you to step into with holy courage?',
      prayer: 'Almighty God, fill my heart with holy boldness. I choose faith over fear because You are with me wherever I go. Amen.',
    },
  },
  {
    dayNumber: 11,
    theme: 'Fellowship & Mutual Encouragement',
    verse: {
      reference: 'Proverbs 27:17',
      text: 'As iron sharpens iron, so one person sharpens another.',
      translation: 'NIV',
      topic: 'Community & Discipleship',
    },
    devotional: {
      title: 'The Refining Power of Godly Friends',
      author: 'Dietrich Bonhoeffer',
      readTime: '3 min read',
      teaser: 'Solitary Christianity is an anomaly. We are built to walk together in accountability and prayer...',
      fullText: 'In biblical times, dull iron tools were struck and ground against harder iron stones to sharpen their edge for harvest and battle. God designs genuine Christian community to do the exact same for our souls. When godly brothers and sisters encourage, pray for, and gently challenge one another in truth and love, spiritual rust is scraped away and our faith becomes razor-sharp.',
      reflectionPrompt: 'Who can you reach out to today on ChristianConnect to encourage or lift up in prayer?',
      prayer: 'Lord, bless my brothers and sisters in Christ. Help me to be an instrument of sharpening, love, and grace in my community. Amen.',
    },
  },
  {
    dayNumber: 12,
    theme: 'The Power of Forgiveness',
    verse: {
      reference: 'Colossians 3:13',
      text: 'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.',
      translation: 'NIV',
      topic: 'Forgiveness & Grace',
    },
    devotional: {
      title: 'Unshackled by Christ’s Grace',
      author: 'Corrie ten Boom',
      readTime: '3 min read',
      teaser: 'Forgiveness does not excuse the past; it frees your future from the poison of bitterness...',
      fullText: 'When we withhold forgiveness, we imprison ourselves in the cell of resentment. Christ’s standard for forgiveness is astonishing: "Forgive as the Lord forgave you." We who have been forgiven an infinite debt of sin at the cross are empowered to extend that same lavish mercy to those who hurt us. Forgiveness is not an emotion; it is an act of obedience that unlocks supernatural healing.',
      reflectionPrompt: 'Is there someone you need to release into God’s hands today through heartfelt forgiveness?',
      prayer: 'Lord, as You have freely forgiven my sins, give me the strength to release all bitterness and forgive others in love. Amen.',
    },
  },
  {
    dayNumber: 13,
    theme: 'Joy in the Lord',
    verse: {
      reference: 'Nehemiah 8:10',
      text: 'Do not grieve, for the joy of the Lord is your strength.',
      translation: 'NIV',
      topic: 'Joy & Praise',
    },
    devotional: {
      title: 'A Wellspring That Never Runs Dry',
      author: 'D.L. Moody',
      readTime: '3 min read',
      teaser: 'Happiness depends on happenings; but the joy of the Lord is rooted in the eternal character of God...',
      fullText: 'Worldly happiness fluctuates with stock markets, health updates, and social accolades. But the joy of the Lord is anchored in the bedrock reality that your sins are forgiven, your name is written in the Lamb’s Book of Life, and Christ is reigning victorious. When trials drain your physical energy, worship will recharge your spirit with heavenly strength.',
      reflectionPrompt: 'What reasons for praise can you voice right now, regardless of your current circumstances?',
      prayer: 'Father, fill my heart with deep, unshakable joy. Let my life be a song of thanksgiving to Your holy name. Amen.',
    },
  },
  {
    dayNumber: 14,
    theme: 'The Secret Place of Prayer',
    verse: {
      reference: 'Psalm 91:1-2',
      text: 'Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. I will say of the Lord, "He is my refuge and my fortress, my God, in whom I trust."',
      translation: 'NIV',
      topic: 'Divine Protection',
    },
    devotional: {
      title: 'Dwelling in the Almighty’s Shadow',
      author: 'E.M. Bounds',
      readTime: '4 min read',
      teaser: 'The secret place of prayer is the most secure fortress in the entire universe...',
      fullText: 'To dwell in someone\'s shadow requires standing exceptionally close to them. Psalm 91 is an invitation to close, unbroken fellowship with God. In the shadow of the Almighty, arrows of spiritual attack lose their sting, fear loses its grip, and divine peace surrounds the believer like a celestial shield.',
      reflectionPrompt: 'How can you protect your daily quiet time with God from digital noise and distractions?',
      prayer: 'Lord, You are my refuge and fortress. Hide me beneath the shadow of Your wings today. Amen.',
    },
  },
];

export function getDailySpotlight(targetDate?: Date): DailySpotlightItem {
  const date = targetDate || new Date();
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - startOfYear.getTime()) + ((startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const index = Math.abs(dayOfYear) % DAILY_SPOTLIGHT_COLLECTION.length;
  return DAILY_SPOTLIGHT_COLLECTION[index];
}
