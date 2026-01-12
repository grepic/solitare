# Performance Optimization Guide 🚀

This guide covers performance best practices and optimizations for the Solitaire mobile app.

## Table of Contents

1. [React Native Performance](#react-native-performance)
2. [Image Optimization](#image-optimization)
3. [Bundle Size Optimization](#bundle-size-optimization)
4. [Memory Management](#memory-management)
5. [Network Optimization](#network-optimization)
6. [Animation Performance](#animation-performance)
7. [Monitoring & Profiling](#monitoring--profiling)

---

## React Native Performance

### Use `React.memo()` for Expensive Components

```typescript
export const PlayingCard = React.memo(({ card, onPress }: Props) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if card changes
  return prevProps.card.id === nextProps.card.id &&
         prevProps.card.position === nextProps.card.position;
});
```

### Use `useMemo()` and `useCallback()`

```typescript
// Expensive computations
const sortedCards = useMemo(() => {
  return cards.sort((a, b) => a.value - b.value);
}, [cards]);

// Event handlers
const handleCardPress = useCallback((cardId: string) => {
  // Logic
}, [/* dependencies */]);
```

### Avoid Inline Functions and Styles

❌ **Bad:**
```typescript
<TouchableOpacity onPress={() => handlePress(item.id)}>
  <View style={{ padding: 10, backgroundColor: '#fff' }}>
```

✅ **Good:**
```typescript
<TouchableOpacity onPress={handlePress}>
  <View style={styles.container}>
```

### Use `FlatList` Optimization Props

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}

  // Performance props
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  updateCellsBatchingPeriod={50}

  // Memory optimization
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

---

## Image Optimization

### Use Appropriate Image Formats

- **PNG**: For images with transparency (avatars, icons)
- **JPG**: For photos and backgrounds (smaller file size)
- **WebP**: Best compression (Android >= 4.2, iOS >= 14)

### Optimize Image Sizes

```bash
# Resize images to exact dimensions needed
npx react-native-asset-resizer input.png output.png 200 200

# Compress images
npx imagemin input.png --out-dir=output --plugin=pngquant
```

### Use `resizeMode` Appropriately

```typescript
<Image
  source={require('./avatar.png')}
  style={styles.avatar}
  resizeMode="cover" // or 'contain', 'stretch', 'center'
/>
```

### Implement Image Caching

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: 'https://example.com/avatar.png',
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable,
  }}
  style={styles.avatar}
/>
```

### Lazy Load Images

```typescript
const [imageLoaded, setImageLoaded] = useState(false);

<View>
  {!imageLoaded && <Skeleton width={200} height={200} />}
  <Image
    source={{ uri: imageUrl }}
    onLoad={() => setImageLoaded(true)}
    style={{ opacity: imageLoaded ? 1 : 0 }}
  />
</View>
```

---

## Bundle Size Optimization

### Analyze Bundle Size

```bash
# Generate bundle report
npx react-native-bundle-visualizer

# Or with Metro
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output bundle.js \
  --sourcemap-output bundle.map
```

### Use Dynamic Imports

```typescript
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### Tree Shaking - Import Only What You Need

❌ **Bad:**
```typescript
import _ from 'lodash';
```

✅ **Good:**
```typescript
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

### Enable Hermes

In `android/app/build.gradle`:
```gradle
project.ext.react = [
    enableHermes: true
]
```

### ProGuard (Android)

Enable in `android/app/build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

---

## Memory Management

### Clean Up Subscriptions and Timers

```typescript
useEffect(() => {
  const subscription = eventEmitter.on('event', handler);
  const timer = setInterval(() => {}, 1000);

  return () => {
    subscription.remove();
    clearInterval(timer);
  };
}, []);
```

### Remove Event Listeners

```typescript
useEffect(() => {
  const listener = Appearance.addChangeListener(handleChange);

  return () => {
    listener.remove();
  };
}, []);
```

### Avoid Memory Leaks in Async Operations

```typescript
useEffect(() => {
  let mounted = true;

  async function fetchData() {
    const data = await api.get('/data');
    if (mounted) {
      setData(data);
    }
  }

  fetchData();

  return () => {
    mounted = false;
  };
}, []);
```

### Use `InteractionManager` for Heavy Operations

```typescript
import { InteractionManager } from 'react-native';

useEffect(() => {
  InteractionManager.runAfterInteractions(() => {
    // Heavy operation after animations complete
    performExpensiveOperation();
  });
}, []);
```

---

## Network Optimization

### Implement Request Caching

```typescript
const cache = new Map();

async function fetchWithCache(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const data = await fetch(url).then(r => r.json());
  cache.set(url, data);
  return data;
}
```

### Use HTTP/2 and Compression

Backend configuration:
```nginx
# Enable HTTP/2
listen 443 ssl http2;

# Enable gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### Batch API Requests

```typescript
// Instead of multiple requests
const user = await api.get('/user');
const stats = await api.get('/stats');
const friends = await api.get('/friends');

// Use single batch endpoint
const { user, stats, friends } = await api.get('/batch', {
  params: { includes: 'user,stats,friends' }
});
```

### Implement Pagination

```typescript
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

async function loadMore() {
  if (!hasMore) return;

  const data = await api.get('/items', {
    params: { page, limit: 20 }
  });

  if (data.length < 20) {
    setHasMore(false);
  }

  setItems(prev => [...prev, ...data]);
  setPage(p => p + 1);
}
```

### Prefetch Data

```typescript
// Prefetch next screen data
navigation.addListener('focus', () => {
  // Prefetch data for likely next screen
  queryClient.prefetchQuery('nextScreenData', fetchNextScreenData);
});
```

---

## Animation Performance

### Use Native Driver

```typescript
Animated.timing(animValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅ Use native driver when possible
}).start();
```

### Avoid Layout Animations on Large Lists

```typescript
// ❌ Bad for long lists
<Animated.View style={{ transform: [{ translateX }] }}>
  <FlatList data={largeArray} />
</Animated.View>

// ✅ Good - animate individual items
<FlatList
  data={items}
  renderItem={({ item }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {item}
    </Animated.View>
  )}
/>
```

### Use `LayoutAnimation` Sparingly

```typescript
import { LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// Use for simple layout changes
LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
setExpanded(!expanded);
```

### Optimize Reanimated

```typescript
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => {
  return {
    transform: [{ scale: withSpring(scale.value) }],
  };
});

<Animated.View style={animatedStyle} />
```

---

## Monitoring & Profiling

### Use React DevTools Profiler

```bash
# Install React DevTools
npm install -g react-devtools

# Run in separate terminal
react-devtools
```

### Monitor with Flipper

```bash
# Install Flipper
brew install --cask flipper

# Run app in debug mode
npm run android
```

**Flipper Plugins:**
- React DevTools
- Network Inspector
- Database Inspector
- Crash Reporter
- Layout Inspector

### Track Performance Metrics

```typescript
import perf from '@react-native-firebase/perf';

// Track screen load time
const trace = await perf().startTrace('screen_load');
await loadScreenData();
await trace.stop();

// Track HTTP requests (automatic with Firebase Perf)
await perf().setPerformanceCollectionEnabled(true);
```

### Memory Profiling

```typescript
// iOS: Use Xcode Instruments
// 1. Open Xcode
// 2. Product > Profile
// 3. Select "Leaks" or "Allocations"

// Android: Use Android Studio Profiler
// 1. Open Android Studio
// 2. View > Tool Windows > Profiler
// 3. Select Memory profiler
```

### CPU Profiling

```bash
# iOS
# 1. In Xcode: Debug > Attach to Process
# 2. Profile with Time Profiler in Instruments

# Android
# 1. In Android Studio: Run > Profile
# 2. Use CPU Profiler
```

---

## Performance Checklist ✅

### Before Release

- [ ] Enable Hermes
- [ ] Enable ProGuard (Android)
- [ ] Optimize and compress images
- [ ] Remove console.log statements
- [ ] Enable code splitting
- [ ] Implement error boundary
- [ ] Add performance monitoring
- [ ] Test on low-end devices
- [ ] Profile memory usage
- [ ] Test network conditions (slow 3G)
- [ ] Measure app launch time
- [ ] Check bundle size
- [ ] Test animations at 60 FPS
- [ ] Implement proper loading states
- [ ] Add offline support where needed

### Ongoing Optimization

- [ ] Monitor crash-free sessions (>99%)
- [ ] Track ANR rate (<0.5%)
- [ ] Monitor app start time (<2s)
- [ ] Check memory usage (<150MB)
- [ ] Track screen load times (<1s)
- [ ] Monitor API response times
- [ ] Review slow screens monthly
- [ ] Update dependencies regularly
- [ ] Profile before major releases

---

## Tools & Resources

### Performance Tools
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Flipper](https://fbflipper.com/)
- [React DevTools](https://github.com/facebook/react-devtools)
- [Why Did You Render](https://github.com/welldone-software/why-did-you-render)
- [Bundle Visualizer](https://github.com/IjzerenHein/react-native-bundle-visualizer)

### Monitoring Services
- [Firebase Performance](https://firebase.google.com/products/performance)
- [Sentry](https://sentry.io/)
- [Datadog](https://www.datadoghq.com/)
- [New Relic](https://newrelic.com/)

### Benchmarking
- [React Native Performance Testing](https://github.com/oblador/react-native-performance)
- [Detox](https://github.com/wix/Detox) - E2E testing

---

## Common Performance Issues & Solutions

### Issue: Slow FlatList Scrolling

**Solution:**
```typescript
<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={5}
  windowSize={10}
  getItemLayout={getItemLayout}
  keyExtractor={keyExtractor}
/>
```

### Issue: Slow Animation Performance

**Solution:**
```typescript
// Use native driver
Animated.timing(value, {
  toValue: 1,
  useNativeDriver: true,
}).start();

// Or use Reanimated for complex animations
import Animated from 'react-native-reanimated';
```

### Issue: Large Bundle Size

**Solution:**
```bash
# Analyze bundle
npx react-native-bundle-visualizer

# Remove unused code
# Use tree shaking
# Enable Hermes
```

### Issue: Memory Leaks

**Solution:**
```typescript
// Always cleanup
useEffect(() => {
  const subscription = source.subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### Issue: Slow API Calls

**Solution:**
```typescript
// Implement caching
// Use pagination
// Batch requests
// Implement retry with exponential backoff
```

---

**Happy Optimizing! 🚀**
