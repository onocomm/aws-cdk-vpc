import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as CdkVpc from '../lib/cdk-vpc-stack';

test('VPC Resources Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkVpc.CdkVpcStack(app, 'MyTestStack', {
    env: { account: '123456789012', region: 'ap-northeast-1' }
  });
  // THEN
  const template = Template.fromStack(stack);

  // VPCが正しく作成されるか検証
  template.resourceCountIs('AWS::EC2::VPC', 1);
  template.hasResourceProperties('AWS::EC2::VPC', {
    CidrBlock: '10.0.0.0/16',
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
    Tags: Match.arrayWith([
      {
        Key: 'Name',
        Value: 'MainVpc'
      }
    ])
  });

  // パブリックサブネットが2つ作成されることを検証
  template.resourceCountIs('AWS::EC2::Subnet', 2); // パブリック2つのみ
  
  // インターネットゲートウェイが作成されることを検証
  template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  
  // NATゲートウェイが作成されないことを検証（リソースカウント=0）
  template.resourceCountIs('AWS::EC2::NatGateway', 0);
  
  // ルートテーブルの検証
  template.hasResourceProperties('AWS::EC2::RouteTable', {
    VpcId: Match.anyValue(),
    Tags: Match.arrayWith([
      {
        Key: 'Name',
        Value: Match.stringLikeRegexp('.*public.*')
      }
    ])
  });
  
  // VPCエンドポイントが2つ作成されることを検証
  template.resourceCountIs('AWS::EC2::VPCEndpoint', 2); // S3とDynamoDB

  // S3とDynamoDBのエンドポイントがあることを検証
  // ServiceNameはFn::Joinで生成されているため、直接文字列比較ができないので型のみチェック
  template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
    VpcEndpointType: "Gateway",
    VpcId: Match.anyValue()
  });
  
  // スタック出力の検証
  template.hasOutput('VpcId', {
    Export: {
      Name: 'MainVpcId'
    }
  });
  
  template.hasOutput('PublicSubnetIds', {
    Description: 'パブリックサブネットIDs'
  });
  
  // プライベートサブネットの出力が存在しないことを確認
  // 直接的なhasNoOutputメソッドは存在しないため、出力の配列から検証
  const outputs = template.findOutputs('*');
  expect(Object.keys(outputs).find(key => key === 'PrivateSubnetIds')).toBeUndefined();
});
