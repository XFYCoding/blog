# Java集合常见工具类

## 集合判空操作工具介绍

判断所有集合内部的元素是否为空，使用 `isEmpty()` 方法，而不是 `size()==0` 的方式。

`isEmpty`相对于我们手动`ifNull`或者自己判断`size`来说无论语义还是健壮性都会出色许多

```java
@Test
public void isEmptyTest() {
    HashMap map = null;
    /**ConcurrentLinkedQueue的size 非O(1)
     *  public int size() {
     *         int count = 0;
     *         for (Node<E> p = first(); p != null; p = succ(p))
     *             if (p.item != null)
     *                 // Collection.size() spec says to max out
     *                 if (++count == Integer.MAX_VALUE)
     *                     break;
     *         return count;
     *     }
     */
    System.out.println(CollectionUtil.isEmpty(map));
}
```

## 集合转Map操作示例

集合转`Map`时完全可以使用`Collectors.toMap`，注意转`Map`时作为`value`的值不可为空，否则会报错，如下代码所示，`HashMap.merge`方法会有这样一个代码段，如果为`null`则会报错

```java
if(value == null) throw new NullPointerException();
```

测试代码

```java
@Test
    public void collectToMapTest() {
    ArrayList < Person > list = new ArrayList < > ();
    list.add(new Person("jack", null));
    list.add(new Person(null, "123"));
    list.stream().collect(Collectors.toMap(Person::getName, Person::getPhoneNumber));
}
```

不建议使用`for`循环等方式进行`remove`，会抛出`ConcurrentModificationException` ，这就是单线程状态下产生的 `fail-fast` 机制。

> fail-fast 机制，即快速失败机制，是java集合(Collection)中的一种错误检测机制。当在迭代集合的过程中该集合在结构上发生改变的时候，就有可能会发生fail-fast，即抛出 ConcurrentModificationException异常。fail-fast机制并不保证在不同步的修改下一定会抛出异常，它只是尽最大努力去抛出，所以这种机制一般仅用于检测bug。

所以我们建议`jdk8`情况下使用这种方式进行动态移除，使用迭代器亦可

```java
/**
 * 进行中移除元素
 */
@Test
public void foreachRemoveTest() {
    List < Integer > list = new ArrayList < > ();
    for(int i = 1; i <= 10; ++i) {
        list.add(i);
    }
    list.removeIf(integer - > integer == 5);
    System.out.println(list.toString()); //[1, 2, 3, 4, 6, 7, 8, 9, 10]
}
```

## 集合去重

> 可以利用 Set 元素唯一的特性，可以快速对一个集合进行去重操作，避免使用 List 的 contains() 进行遍历去重或者判断包含操作。

如下代码所示，`list`去重需要调用`contains`，要遍历数组，而set底层用hash计算，如果散列良好情况下判重只需要`O(1)`

```java
@Test
public void addRepetitionElements() {
    int size = 10 _0000;
    List < Integer > resultList = new ArrayList < > (size);
    long start = System.currentTimeMillis();
    for(int i = 0; i < size; i++) {
        /**
         * public int indexOf(Object o) {
         *         if (o == null) {
         *             for (int i = 0; i < size; i++)
         *                 if (elementData[i]==null)
         *                     return i;
         *         } else {
         *             for (int i = 0; i < size; i++)
         *                 if (o.equals(elementData[i]))
         *                     return i;
         *         }
         *         return -1;
         *     }
         */
        if(!resultList.contains(i)) {
            resultList.add(i);
        }
    }
    long end = System.currentTimeMillis();
    System.out.println("List去重:" + (end - start));
    start = System.currentTimeMillis();
    HashSet < Integer > set = new HashSet < > ();
    for(int i = 0; i < size; i++) {
        set.add(i);
    }
    end = System.currentTimeMillis();
    System.out.println("HashSet去重:" + (end - start));
    /**
     * 输出结果
     * List去重:5820
     * HashSet去重:9
     */
}
```

使用集合转数组的方法，必须使用集合的 toArray(T[] array)，传入的是类型完全一致、长度为 0 的空数组。

```java
@Test
public void convertToArrTest() {
    String[] s = new String[] {
        "dog", "lazy", "a", "over", "jumps", "fox", "brown", "quick", "A"
    };
    List < String > list = Arrays.asList(s);
    Collections.reverse(list);
    //集合转数组
    s = list.toArray(new String[0]);
    for(String s1: s) {
        System.out.println(s1);
    }
}
```

## 数组转集合

> 使用工具类 Arrays.asList() 把数组转换成集合时，转成的集合是Arrays$ArrayList，不能使用其修改集合相关的方法， 它并没有重写 add/remove/clear 方法，所以会抛出 UnsupportedOperationException 异常。

```java
@Test
public void arrConvertToListTest() {
    List myList = Arrays.asList(1, 2, 3);
    System.out.println(myList.getClass());
    System.out.println(myList.get(0));
    /**
     * 下面的方法没有重写 所以会报错
     * 解决办法
     *  myList=new ArrayList(myList);
     */
    myList.add(4); //运行时报错：UnsupportedOperationException
    myList.remove(1); //运行时报错：UnsupportedOperationException
    myList.clear(); //运行时报错：UnsupportedOperationException
}
```

## Java集合工具类

### 排序操作

常见排序操作简介如下

```java
void reverse(List list)//反转
void shuffle(List list)//随机排序
void sort(List list)//按自然排序的升序排序
void sort(List list, Comparator c)//定制排序，由Comparator控制排序逻辑
void swap(List list, int i , int j)//交换两个索引位置的元素
void rotate(List list, int distance)//旋转。当distance为正数时，将list后distance个元素整体移到前面。当distance为负数时，将 list的前distance个元素整体移到后面
```

**代码示例**

具体方法演示如下，读者可以自行运行查看

```java
 List < Integer > list = Arrays.asList(1, 3, 4484, 31, 31, 5433, 4864, 68, 1, 564, 684, 161, 465);
 System.out.println("Collections  升序排序:");
 Collections.sort(list); //正常排序
 System.out.println(list);
 System.out.println("Collections  倒叙排序:");
 Collections.sort(list, Comparator.reverseOrder());
 System.out.println(list);
 System.out.println("Collections  翻转:");
 Collections.reverse(list);
 System.out.println(list);
 System.out.println("Collections  随机排序:");
 Collections.shuffle(list);
 System.out.println(list);
 System.out.println("Collections  升序排序后旋转一步:");
 Collections.sort(list);
 System.out.println(list);
 Collections.rotate(list, 1);
 System.out.println(list);
 System.out.println("Collections  交换两个索引位置元素:");
 Collections.swap(list, 0, 1);
 System.out.println(list);
```

### 排序方法Collections.sort底层实现

`Collections.sort`通过`Arrays.sort`然后调用`TimSort`完成排序如下源码所示，可以看到`Arrays.sort`底层使用两种排序算法，而`Collections.sort`使用的则是`TimSort`，所以笔者就下文就对这种算法进行简单的介绍。

```java
public static < T > void sort(T[] a, Comparator <? super T > c) {
    if(c == null) {
        sort(a);
    } else {
        if(LegacyMergeSort.userRequested) legacyMergeSort(a, c);
        else TimSort.sort(a, 0, a.length, c, null, 0, 0);
    }
}
```

## TimSort简介

`TimSort`是自适应的、混合的、稳定的排序算法。是基于归并和二分插入排序优点结合的排序算法。复杂度最坏的情况下只有`O(nlogn)`，最坏的情况下，空间复杂度为`O(n/2)`。

## 二分插入排序法

二分插入排序法是插入排序法的升级版本，如下所示，我们都知道插入排序后左边的元素都是有序的，如果使用常规二分排序，那么最坏情况下插入时间是On，所以我们基于左边有序这个特点改用二分插入的方式完成排序优化了这个问题。

如下图所示，右边就是待排序的元素，在进行排序插入时，我们会通过二分比较法完成元素的插入。

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071055061.png)

## 核心源码解析TimSort

**数组大小小于32情况下的排序**

我们先用简单的图解来了解这个算法，可以看到数组初始化索引和值如下所示

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071056798.png)

`timsort`会找到这个数组中有序的范围，以本次例子为示例，只有0、1是升序有序的，注意如果0-1为降序有序的话，该算法会将这几个元素翻转成升序。

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071056856.png)

确定范围后，将有序范围之后的元素不断通过二分比较法插入到左边数组中

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071056689.png)

了解了小于数组容量小于`32`的数组的工作机制后，我们就通过一段测试代码通过源码的了解具体工过程。

如下所示，可以看到笔者添加8个整数，调用`Collections.sort`

```java
public static void main(String[] args) {
    List < Integer > list = new ArrayList < > ();
    list.add(15);
    list.add(18);
    list.add(6);
    list.add(1);
    list.add(7);
    list.add(8);
    list.add(3);
    list.add(9);
    System.out.println("Collections  升序排序:");
    Collections.sort(list); //正常排序
    System.out.println(list);
    System.out.println("Collections  升序排序:");
    Collections.sort(list); //正常排序
    System.out.println(list);
}
```

核心代码如下:

这里笔者需要介绍下面代码的变量

```tex
1. lo待排序的数组最小值
2. hi 待排序的数组的最大值
3. nRemaining：需要进行排序的数组长度，由hi-lo得出
```

核心排序代码就在下面，整体要做的事情就是:

```tex
1. 找到待排序的数组长度
2. 在这个待排序的lo-hi之间找到有序范围
3. 把有序范围之后的元素基于二分插入法插入到有序范围的数组中
```

由于`TimSort`排序代码如下，可以看到数组小于`32`会直接调用`binarySort`完成排序后直接返回，具体代码参见注释

```java
 int nRemaining = hi - lo; //计算出待排序的范围
 if(nRemaining < 2) return; // Arrays of size 0 and 1 are always sorted
 // 若小于32则直接调用`binarySort`
 if(nRemaining < MIN_MERGE) {
     //计算出lo 到 hi 范围找出有序的长度，若是降序则转为升序后返回
     int initRunLen = countRunAndMakeAscending(a, lo, hi, c);
     //使用二分插入法将hi以内未排序的元素插入到数组中
     binarySort(a, lo, hi, lo + initRunLen, c);
     //完成后直接返回
     return;
 }
```

了解了大概思路之后我们再深入查看一下`countRunAndMakeAscending`，可以看到这个方法做的事情就是从数组中找到最小范围的有序子数组，若为降序则翻转为升序。这一步实际要做的，就是我们上图中查找有序子数组那幅图。

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071056240.png)

了解上面的介绍后下面的源码基于注释就一目了然了

```java
private static < T > int countRunAndMakeAscending(T[] a, int lo, int hi, Comparator <? super T > c) {
    assert lo < hi;
    // 待比较的值从lo+1 开始
    int runHi = lo + 1;
    if(runHi == hi) return 1;
    // 第一次比较若小于0就进入循环，找到最小范围的降序子数组，循环结束后翻转为升序
    if(c.compare(a[runHi++], a[lo]) < 0) { // Descending
        while(runHi < hi && c.compare(a[runHi], a[runHi - 1]) < 0) runHi++;
        //循环结束后翻转为升序
        reverseRange(a, lo, runHi);
    } else {
        //反之就寻找升序子数组
        while(runHi < hi && c.compare(a[runHi], a[runHi - 1]) >= 0) runHi++;
    }
    //runHi - lo即我们本次找到的有序子数组的长度
    return runHi - lo;
}
```

然后我们再介绍`binarySort`，可以看到下面这段代码，可以看到索引`start`开始的元素，都会通过二分法插入到`lo`和`start`之间，具体可以查看代码的注释以及笔者下文贴出的图片

```java
private static < T > void binarySort(T[] a, int lo, int hi, int start, Comparator <? super T > c) {
    assert lo <= start && start <= hi;
    if(start == lo) start++;
    for(; start < hi; start++) {
        T pivot = a[start];
        // 二分搜索范围设置为[lo,start)
        int left = lo;
        int right = start;
        assert left <= right;
        //通过二分法，找到合适插入位置
        while(left < right) {
            int mid = (left + right) >>> 1;
            if(c.compare(pivot, a[mid]) < 0) right = mid;
            else left = mid + 1;
        }
        assert left == right;
        int n = start - left; // 计算需要移动的步数
        // 这里正是设计者的精华所在，可以看到如果只要移动1-2步，直接交换即可，若大于两步则直接指定数组范围进行批量拷贝
        switch(n) {
            case 2:
                a[left + 2] = a[left + 1];
            case 1:
                a[left + 1] = a[left];
                break;
            default:
                System.arraycopy(a, left, a, left + 1, n);
        }
        a[left] = pivot;
    }
}
```

该过程就像下面这张图一样，通过不断将start元素插入到左边，完成二分插入排序。

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071056836.png)

**数组大于32情况下的排序**

```java
public static void main(String[] args) {
    List < Integer > list = new ArrayList < > ();
    Random r = new Random();
    for(int i = 0; i < 100; i++) {
        list.add(r.nextInt(100));
    }
    System.out.println("Collections  升序排序:");
    Collections.sort(list); //正常排序
    System.out.println(list);
}
```

核心代码如下

```java
TimSort < T > ts = new TimSort < > (a, c, work, workBase, workLen);
int minRun = minRunLength(nRemaining);
do {
    // 计算出最大的有序范围的索引
    int runLen = countRunAndMakeAscending(a, lo, hi, c);
    //若小于minRun，则说明进行排序的数组太小，需要指定一个范围排序一下
    if(runLen < minRun) {
        //nRemaining 为当前待排序的范围大小，minRun 为计算出来至少要排序的范围。若nRemaining 小于minRun ，则取nRemaining ，意味需要排序的范围就剩几个了直接用这几个值排个序就好了。反之则取minRun 进行二分插入排序
        int force = nRemaining <= minRun ? nRemaining : minRun;
        binarySort(a, lo, lo + force, lo + runLen, c);
        //完成后force的值就代表当前经历排序的元素个数，存到runLen中，作为后续合并的依据
        runLen = force;
    }
    // 将lo到runLen的值存到栈中，后续归并会用到
    ts.pushRun(lo, runLen);
    //将当前排序的范围数组归并到已排序的数组中
    ts.mergeCollapse();
    // 起始位置加到runLen之后
    lo += runLen;
    //待排序的值减去已排序的长度
    nRemaining -= runLen;
} while (nRemaining != 0);
// Merge all remaining runs to complete sort
assert lo == hi;
ts.mergeForceCollapse();
assert ts.stackSize == 1;
```

由于这篇文章主要描述Java集合工具类的使用，所以就不展开细讲了，感兴趣的朋友可以参考这两篇文章

[世界上最快的排序算法——Timsort (opens new window)](https://www.cnblogs.com/sunshuyi/p/12680918.html)

[TimSort源码详解(opens new window)](https://www.cnblogs.com/hejiayang/p/14119741.html)

## rotate实现

### 测试代码

测试代码如下，可以看到我们希望所有的元素都往前移动一步

```java
 System.out.println("Collections  升序排序后旋转一步:");
 Collections.sort(list);
 System.out.println(list);
 Collections.rotate(list, 1);
 System.out.println(list);
```

### 查看大概实现

代码如下所示，可以看到如果是`RandomAccess` 或者数组大小小于`100`时使用`rotate1`，反之用`rotate2`，我们不妨步进查看底层实现机制

```java
public static void rotate(List <? > list, int distance) {
    if(list instanceof RandomAccess || list.size() < ROTATE_THRESHOLD) rotate1(list, distance);
    else rotate2(list, distance);
}
```

### rotate1

```java
private static < T > void rotate1(List < T > list, int distance) {
    int size = list.size();
    if(size == 0) return;
    //计算移动的步数
    distance = distance % size;
    //若为负数则加上数组大小 即可 (向左走n步)==(向右走数组大小+n步)
    if(distance < 0) distance += size;
    if(distance == 0) return;
    //移动
    for(int cycleStart = 0, nMoved = 0; nMoved != size; cycleStart++) {
        T displaced = list.get(cycleStart);
        int i = cycleStart;
        do {
            i += distance;
            //若大于数组大小则减去数组大小得出最终要走的步
            if(i >= size) i -= size;
            //赋值并返回旧元素进行下一次do while旋转
            displaced = list.set(i, displaced);
            nMoved++;
        } while (i != cycleStart);
    }
}
```

### rotate2

走到这个函数则说明这个数组为链表，为了保证性能，我们通过遍历找到需要移动到数组索引范围一起挪动到最前面。

例如我们将上面代码的列表改为链表，我们希望全部向前移动一步，那么mid就是999，从0-999的元素往后移动，`999-1000`的元素往前移动，如下图所示，这样做的好处就是避免逐个挪动，改为批量挪动从而提高执行效率。

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071056172.png)

```java
private static void rotate2(List <? > list, int distance) {
    int size = list.size();
    if(size == 0) return;
    int mid = -distance % size;
    if(mid < 0) mid += size;
    if(mid == 0) return;
    reverse(list.subList(0, mid));
    reverse(list.subList(mid, size));
    reverse(list);
}
```

## 查找,替换操作

```java
int binarySearch(List list, Object key)//对List进行二分查找，返回索引，注意List必须是有序的
int max(Collection coll)//根据元素的自然顺序，返回最大的元素。 类比int min(Collection coll)
int max(Collection coll, Comparator c)//根据定制排序，返回最大元素，排序规则由Comparatator类控制。类比int min(Collection coll, Comparator c)
void fill(List list, Object obj)//用指定的元素代替指定list中的所有元素
int frequency(Collection c, Object o)//统计元素出现次数
int indexOfSubList(List list, List target)//统计target在list中第一次出现的索引，找不到则返回-1，类比int lastIndexOfSubList(List source, list target)
boolean replaceAll(List list, Object oldVal, Object newVal)//用新元素替换旧元素
```

### 使用示例

```java
 System.out.println("Collections  二分搜索法(注意数组并需有序):");
 Collections.sort(list);
 int idx = Collections.binarySearch(list, 1);
 System.out.println(idx);
 System.out.println("Collections  求最大值:");
 System.out.println(Collections.max(list));
 System.out.println("Collections  按自定义方式找最大值:");
 System.out.println(Collections.max(list, Comparator.reverseOrder()));
 System.out.println("Collections  用指定元素替代list中所有的元素:");
 Collections.fill(list, 5);
 System.out.println(list);
 System.out.println("Collections  统计频次:");
 System.out.println(Collections.frequency(list, 5));
 System.out.println("Collections  返回target子集在list中第一次出现的位置:");
 List < Integer > list1 = Arrays.asList(1, 2, 3, 4, 5, 6);
 List < Integer > target = Arrays.asList(3, 4);
 System.out.println(Collections.indexOfSubList(list1, target)); //返回target子集在list中第一次出现的位置
 System.out.println("Collections  replaceAll:");
 Collections.replaceAll(list, 5, 6);
 System.out.println(list);
```

### 洗牌算法

实现方式很简单，倒着遍历，例如遍历到索引i,那么就在小于i的索引中挑一个与其交换。如下源码所示，注意如果数组是链表或者数据量很大的话，建议少用洗牌算法，性能开销略大。

```java
public static void shuffle(List <? > list, Random rnd) {
    int size = list.size();
    //若小于SHUFFLE_THRESHOLD 或者是RandomAccess类则从高位索引与随机一个低位索引交换值完成洗牌
    if(size < SHUFFLE_THRESHOLD || list instanceof RandomAccess) {
        for(int i = size; i > 1; i--) swap(list, i - 1, rnd.nextInt(i));
    } else {
        //反之转成数组，再遍历数组的值存到list中
        Object arr[] = list.toArray();
        for(int i = size; i > 1; i--) swap(arr, i - 1, rnd.nextInt(i));
        ListIterator it = list.listIterator();
        for(int i = 0; i < arr.length; i++) {
            it.next();
            it.set(arr[i]);
        }
    }
}
```

对此我们不妨基于list和链表进行性能测试一下

```java
@Test
public void shuffleTest() {
    ArrayList < Integer > arrayList = new ArrayList < > ();
    LinkedList < Integer > linkedList = new LinkedList < > ();
    int size = 100 _0000;
    Random r = new Random();
    for(int i = 0; i < size; i++) {
        arrayList.add(r.nextInt(size));
        linkedList.add(r.nextInt(size));
    }
    long start = System.currentTimeMillis();
    Collections.shuffle(arrayList);
    long end = System.currentTimeMillis();
    System.out.println("Collections.shuffle(arrayList);:" + (end - start));
    start = System.currentTimeMillis();
    Collections.shuffle(linkedList);
    end = System.currentTimeMillis();
    System.out.println(" Collections.shuffle(linkedList);:" + (end - start));
}
```

可以看到顺序表处理时间远远低于链表

```java
Collections.shuffle(arrayList);:34
Collections.shuffle(linkedList);:56
```

## 同步控制

### 简介

注意，非必要不要使用这种`API`，效率极低

```java
synchronizedCollection(Collection<T>  c) //返回指定 collection 支持的同步（线程安全的）collection。
synchronizedList(List<T> list)//返回指定列表支持的同步（线程安全的）List。
synchronizedMap(Map<K,V> m) //返回由指定映射支持的同步（线程安全的）Map。
synchronizedSet(Set<T> s) //返回指定 set 支持的同步（线程安全的）set。
```

### 代码示例

可以看到笔者在下面贴出使用`Collections.synchronizedList`包装后的`list`的`add`方法，锁的粒度很大，在多线程操作情况下，性能非常差。

我们就以`synchronizedList`为例查看其`add`方法，可以看到其实现线程安全的方式很简单，直接在工作代码上`synchronized` ，在高并发情况下，很可能造成大量线程阻塞

```java
public void add(int index, E element) {
    synchronized(mutex) {
        list.add(index, element);
    }
}
```

示例代码如下，我们分别开两个线程，往数组中添加1000个数组，可以看到笔者注释代码中用了普通list，以及通过`Collections.synchronizedList`后的list，感兴趣的读者可以基于下面代码测试是否线程安全

```java
@Test
public void ThreadSafe() {
    CountDownLatch latch = new CountDownLatch(1);
    //        List<Integer> list = new ArrayList<>();
    List < Integer > list = Collections.synchronizedList(new ArrayList < > ());
    ExecutorService threadPool = Executors.newFixedThreadPool(2);
    for(int i = 0; i < 2; i++) {
        threadPool.submit(() - > {
            try {
                latch.await();
            } catch(InterruptedException e) {
                e.printStackTrace();
            }
            for(int j = 0; j < 1000; j++) {
                list.add(j);
            }
        });
    }
    latch.countDown();
    threadPool.shutdown();
    while(!threadPool.isTerminated()) {}
    System.out.println(list.size());
}
```

输出结果为2000，说明该方法确实实现了线程安全

```java
2000
```

## 参考文献

[Java集合使用注意事项总结(opens new window)](https://javaguide.cn/java/collection/java-collection-precautions-for-use.html#集合判空)

[面经手册 · 第10篇《扫盲java.util.Collections工具包，学习排序、二分、洗牌、旋转算法》(opens new window)](https://bugstack.cn/md/java/interview/2020-09-10-面经手册 · 第10篇《扫盲java.util.Collections工具包，学习排序、二分、洗牌、旋转算法》.html#_3-collections-shuffle-洗牌算法)