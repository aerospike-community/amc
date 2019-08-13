require 'rubygems'
require 'aerospike'

hosts = [ Aerospike::Host.new("ubvm", 3000) ];
policy = Aerospike::ClientPolicy.new(fail_if_not_connected: false, timeout: 10)
client = Aerospike::Client.new(hosts, policy: policy);
ns  = 'test'
set = 'adjust'
k = Aerospike::Key.new(ns, set, 'key')

vallength = 32

val = "b" * vallength

k = Aerospike::Key.new(ns, set, "key")
# 10.times do |i|
#     n = i + 1
#     map = Hash[n.times.map{|n| ["key#{n}", val]}]
#     client.put(k,[Aerospike::Bin.new("bin#{n}", map)])
# end

# map = {}
# char = 'c'
# 17.times do |i|
# 	sub_map = Hash[i.times.map{|i| ["val#{i}", char*(2**i)]}]
#     map = Hash[i.times.map{|i| ["key#{i}", sub_map]}]
#     client.put(k,[Aerospike::Bin.new("bin#{i}", map)])
# end

map = {}
char = 'c'
17.times do |i|
	sub_list = i.times.map{|i| char*(2**i)}
    map = Hash[i.times.map{|i| ["key#{i}", sub_list]}]
    client.put(k,[Aerospike::Bin.new("bin#{i}", map)])
end
